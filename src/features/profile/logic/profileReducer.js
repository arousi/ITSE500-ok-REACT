import axios from "axios";
import logger from "../../../core/logger";
import env from "../../../config/env";
import { unifiedSync, authApi } from "../../../core/apiClient";
import { ensureAuthAxios } from "./authAxios";
import {
  checkRequiredProfileData,
  validateEmail,
  validatePhone,
} from "../../dashboard/logic/validationData";
import {
  refreshConversations,
  saveUserProfileRow,
  clearUserProfileRow,
} from "../../user-home-page/logic/connectIndexedDB";

// Helper: refresh access token and update auth in state
async function refreshAccessToken(payload) {
  const refreshBody = { refresh: payload?.auth?.data?.refresh_token };
  const primaryBase = env.authBaseUrl;
  try {
    const resp = await axios.post(
      `${primaryBase}/api/v1/auth_api/token/refresh/`,
      refreshBody,
      { headers: { "Content-Type": "application/json" } }
    );
    const newAccess = resp?.data?.access || resp?.data?.access_token;
    const newRefresh =
      resp?.data?.refresh ||
      resp?.data?.refresh_token ||
      payload?.auth?.data?.refresh_token;
    if (newAccess && payload?.setAuth) {
      const current = payload.auth;
      payload.setAuth({
        ...current,
        data: {
          ...current?.data,
          access_token: newAccess,
          refresh_token: newRefresh,
        },
      });
    }
    return newAccess || null;
  } catch (_) {
    return null;
  }
}

export default async function profileReducer(state, action) {
  switch (action.type) {
    case "GET_PROFILE": {
      if (!action.payload?.auth) break;
      ensureAuthAxios({
        auth: action.payload.auth,
        setAuth: action.payload.setAuth,
      });
      // Build query params as per UnifiedSyncView: require an identifier on GET
      const authData = action.payload.auth?.data || {};
      const qp = new URLSearchParams();
      qp.set("profile", "true");
      qp.set("chat", "false");
      const lsVisitor =
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("visitor_id")) ||
        "";
      if (authData.user_id || authData.id)
        qp.set("user_id", authData.user_id || authData.id);
      else if (authData.anon_id || lsVisitor)
        qp.set("anon_id", authData.anon_id || lsVisitor);
      else if (authData.temp_id) qp.set("temp_id", authData.temp_id);
      try {
        const did =
          (typeof localStorage !== "undefined" &&
            localStorage.getItem("device_id")) ||
          "";
        if (did) qp.set("device_id", did);
      } catch (_) {}
      // Use unifiedSync client
      const paramsObj = Object.fromEntries(qp);
      const token = action.payload.auth?.data?.access_token || null;
      try {
        const resp = await unifiedSync.getMe(paramsObj, token);
        const data = resp?.data || {};
        // Some servers return minimal profile at top-level (email, username). Prefer profile, fallback to top-level.
        const prof = (data && typeof data.profile === 'object' && data.profile !== null) ? data.profile : data;
        const userProfile = {
          user_id: data?.user_id ?? action.payload.auth?.data?.user_id ?? null,
          username: prof?.username ?? action.payload.auth?.data?.username ?? "",
          first_name: prof?.first_name ?? action.payload.auth?.data?.first_name ?? "",
          last_name: prof?.last_name ?? action.payload.auth?.data?.last_name ?? "",
          email: prof?.email ?? action.payload.auth?.data?.email ?? "",
          phone_number: prof?.phone_number ?? action.payload.auth?.data?.phone_number ?? "",
          biometric_enabled: prof?.biometric_enabled ?? false,
          email_verified: prof?.email_verified ?? false,
          is_archived: prof?.is_archived ?? false,
          is_active: prof?.is_active ?? true,
          is_google_user: prof?.is_google_user ?? false,
          is_openrouter_user: prof?.is_openrouter_user ?? false,
          date_joined: prof?.date_joined ?? null,
        };
        action.payload.setUserProfile &&
          action.payload.setUserProfile(userProfile);
        try {
          await saveUserProfileRow(userProfile);
        } catch (_) {}
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          const newAccess = await refreshAccessToken({
            auth: action.payload.auth,
            setAuth: action.payload.setAuth,
          });
          if (newAccess) {
            const re = await unifiedSync.getMe(paramsObj, newAccess);
            const data = re?.data || {};
            const prof = (data && typeof data.profile === 'object' && data.profile !== null) ? data.profile : data;
            const userProfile = {
              user_id: data?.user_id ?? null,
              username: prof?.username ?? "",
              first_name: prof?.first_name ?? "",
              last_name: prof?.last_name ?? "",
              email: prof?.email ?? "",
              phone_number: prof?.phone_number ?? "",
              biometric_enabled: prof?.biometric_enabled ?? false,
              email_verified: prof?.email_verified ?? false,
              is_archived: prof?.is_archived ?? false,
              is_active: prof?.is_active ?? true,
              is_google_user: prof?.is_google_user ?? false,
              is_openrouter_user: prof?.is_openrouter_user ?? false,
              date_joined: prof?.date_joined ?? null,
            };
            action.payload.setUserProfile &&
              action.payload.setUserProfile(userProfile);
            try {
              await saveUserProfileRow(userProfile);
            } catch (_) {}
          } else {
            // Fallback for visitors without valid tokens: request temporary tokens via temp_id
            const authData2 = action.payload.auth?.data || {};
            const tempId = authData2.temp_id || "";
            if (tempId) {
              const re = await unifiedSync.getMe({ profile: false, chat: false, temp_id: tempId }, null);
              const toks = re?.data?.tokens || {};
              if (toks?.access && action.payload.setAuth) {
                const current = action.payload.auth;
                action.payload.setAuth({
                  ...current,
                  data: {
                    ...current?.data,
                    access_token: toks.access,
                    refresh_token: toks.refresh || current?.data?.refresh_token,
                  },
                });
                const re2 = await unifiedSync.getMe(paramsObj, toks.access);
                const data2 = re2?.data || {};
                const prof2 = data2?.profile || {};
                const userProfile2 = {
                  user_id: data2?.user_id ?? null,
                  username: prof2?.username ?? "",
                  first_name: prof2?.first_name ?? "",
                  last_name: prof2?.last_name ?? "",
                  email: prof2?.email ?? "",
                  phone_number: prof2?.phone_number ?? "",
                  biometric_enabled: prof2?.biometric_enabled ?? false,
                  email_verified: prof2?.email_verified ?? false,
                  is_archived: prof2?.is_archived ?? false,
                  is_active: prof2?.is_active ?? true,
                  is_google_user: prof2?.is_google_user ?? false,
                  is_openrouter_user: prof2?.is_openrouter_user ?? false,
                  date_joined: prof2?.date_joined ?? null,
                };
                action.payload.setUserProfile &&
                  action.payload.setUserProfile(userProfile2);
                try { await saveUserProfileRow(userProfile2); } catch (_) {}
              } else {
                throw e;
              }
            } else {
              throw e;
            }
          }
        } else {
          throw e;
        }
      }
      break;
    }
    case "GET_CONVERSATIONS": {
      const data = action.payload || {};
      const authData = data.auth?.data || {};
      const setConversations = data.setConversations;
      const userId = authData.user_id || authData.id || "";
      const anonId = authData.anon_id || "";
      const tempId = authData.temp_id || "";
      const params = new URLSearchParams();
      // flags per UnifiedSyncView
      params.set("chat", "true");
      params.set("profile", "false");
      if (userId) params.set("user_id", userId);
      else if (anonId) params.set("anon_id", anonId);
      else if (tempId) {
        params.set("temp_id", tempId);
        try {
          const did =
            (typeof localStorage !== "undefined" &&
              localStorage.getItem("device_id")) ||
            "";
          if (did) params.set("device_id", did);
        } catch (_) {}
      }
      try {
        const token2 = authData?.access_token || null;
        const resp = await unifiedSync.getMe(
          Object.fromEntries(params),
          token2
        );
        const body = resp?.data || {};
        const conversations = Array.isArray(body?.conversations)
          ? body.conversations
          : [];
        // Derive flat arrays from nested conversations if top-level arrays are not provided
        const nestedMessages = conversations.flatMap((c) =>
          Array.isArray(c?.messages) ? c.messages : []
        );
        const messages = Array.isArray(body?.messages)
          ? body.messages
          : nestedMessages;
        const derive = (arr, keys) =>
          arr.flatMap((m) => {
            for (const k of keys) {
              if (Array.isArray(m?.[k])) return m[k];
            }
            return [];
          });
        const message_requests = Array.isArray(body?.message_requests)
          ? body.message_requests
          : derive(messages, ["requests", "message_requests"]);
        const message_responses = Array.isArray(body?.message_responses)
          ? body.message_responses
          : derive(messages, ["responses", "message_responses"]);
        const message_outputs = Array.isArray(body?.message_outputs)
          ? body.message_outputs
          : derive(messages, ["outputs", "message_outputs"]);
        // Update local cache and UI
        try {
          refreshConversations(
            conversations,
            messages,
            message_requests,
            message_responses,
            message_outputs
          );
        } catch (_) {}
        if (typeof setConversations === "function")
          setConversations(conversations);
      } catch (e) {
        throw e;
      }
      break;
    }
    case "UPDATE_PROFILE": {
      const updates = action.payload.userUpdated || {};
      const requiredKeys = [
        "username",
        "first_name",
        "last_name",
        "email",
        "phone_number",
      ];
      const isFullUpdate = requiredKeys.every((k) => Object.prototype.hasOwnProperty.call(updates, k));

      // Validation: full update must pass all validations; partial validates only provided fields
      if (isFullUpdate) {
        if (!checkRequiredProfileData(updates)) {
          action.payload.setError("Please fill all fields");
          setTimeout(() => action.payload.setError(""), 3000);
          break;
        }
        if (!validateEmail(updates.email)) {
          action.payload.setError("Enter valid email address");
          setTimeout(() => action.payload.setError(""), 3000);
          break;
        }
        if (!validatePhone(updates.phone_number || updates.phone_number === "")) {
          action.payload.setError("Enter valid phone number");
          setTimeout(() => action.payload.setError(""), 3000);
          break;
        }
      } else {
        // Partial: only validate fields that are being updated
        if (Object.prototype.hasOwnProperty.call(updates, "email") && !validateEmail(updates.email)) {
          action.payload.setError("Enter valid email address");
          setTimeout(() => action.payload.setError(""), 3000);
          break;
        }
        if (
          Object.prototype.hasOwnProperty.call(updates, "phone_number") &&
          !validatePhone(updates.phone_number || updates.phone_number === "")
        ) {
          action.payload.setError("Enter valid phone number");
          setTimeout(() => action.payload.setError(""), 3000);
          break;
        }
      }

      try {
        if (action.payload.auth) {
          ensureAuthAxios({
            auth: action.payload.auth,
            setAuth: action.payload.setAuth,
          });
          const authData = action.payload?.auth?.data || {};
          const lsVisitor =
            (typeof localStorage !== "undefined" &&
              localStorage.getItem("visitor_id")) ||
            "";
          const common = {
            ...(authData.user_id || authData.id
              ? { user_id: authData.user_id || authData.id }
              : {}),
            ...(!(authData.user_id || authData.id) && (authData.anon_id || lsVisitor)
              ? { anon_id: authData.anon_id || lsVisitor }
              : {}),
            ...(!(authData.user_id || authData.id) && !(authData.anon_id || lsVisitor) && authData.temp_id
              ? { temp_id: authData.temp_id }
              : {}),
            ...(typeof localStorage !== "undefined" && localStorage.getItem("device_id")
              ? { device_id: localStorage.getItem("device_id") }
              : {}),
          };

          const body = { ...common, profile: { ...updates } };
          const token3 = action.payload.auth?.data?.access_token || null;
          const send = async (tkn) => {
            if (isFullUpdate) return unifiedSync.postMe(body, tkn);
            return unifiedSync.patchMe(body, tkn);
          };
          try {
            await send(token3);
          } catch (e) {
            // If server doesn't support PATCH (405), fallback to POST even for partial updates
            if (!isFullUpdate && (e?.response?.status === 405 || e?.status === 405)) {
              let postErr = null;
              try { await unifiedSync.postMe(body, token3); }
              catch (e2) {
                if (e2?.response?.status !== 401) throw e2; // let 401 handler below run
                postErr = e2;
              }
              if (!postErr || !postErr?.response || postErr?.response?.status !== 401) {
                // Succeeded without needing refresh
                try { await saveUserProfileRow({ user_id: action.payload.auth?.data?.user_id, ...updates }); } catch(_) {}
                break;
              }
            }
            if (e?.response?.status === 401) {
              const newAccess = await refreshAccessToken({
                auth: action.payload.auth,
                setAuth: action.payload.setAuth,
              });
              if (newAccess) {
                try {
                  await send(newAccess);
                } catch (e3) {
                  if (!isFullUpdate && (e3?.response?.status === 405 || e3?.status === 405)) {
                    await unifiedSync.postMe(body, newAccess);
                  } else if (isFullUpdate && (e3?.response?.status === 405 || e3?.status === 405)) {
                    // Unexpected, but if POST is not allowed, try PATCH
                    await unifiedSync.patchMe(body, newAccess);
                  } else {
                    throw e3;
                  }
                }
              } else {
                // Try to obtain visitor tokens via temp_id then retry
                const authData2 = action.payload.auth?.data || {};
                const tempId2 = authData2.temp_id || "";
                if (tempId2) {
                  try {
                    const re = await unifiedSync.getMe({ profile: false, chat: false, temp_id: tempId2 }, null);
                    const toks = re?.data?.tokens || {};
                    if (toks?.access && action.payload.setAuth) {
                      const current = action.payload.auth;
                      action.payload.setAuth({
                        ...current,
                        data: {
                          ...current?.data,
                          access_token: toks.access,
                          refresh_token: toks.refresh || current?.data?.refresh_token,
                        },
                      });
                      try {
                        await send(toks.access);
                      } catch (e4) {
                        if (!isFullUpdate && (e4?.response?.status === 405 || e4?.status === 405)) {
                          await unifiedSync.postMe(body, toks.access);
                        } else if (isFullUpdate && (e4?.response?.status === 405 || e4?.status === 405)) {
                          await unifiedSync.patchMe(body, toks.access);
                        } else {
                          throw e4;
                        }
                      }
                    } else {
                      throw e;
                    }
                  } catch (_) {
                    throw e;
                  }
                } else {
                  throw e;
                }
              }
            } else {
              // If PATCH not allowed and we didn't handle above, retry with POST for partial
              if (!isFullUpdate && (e?.response?.status === 405 || e?.status === 405)) {
                await unifiedSync.postMe(body, token3);
              } else if (isFullUpdate && (e?.response?.status === 405 || e?.status === 405)) {
                // Unexpected: POST not allowed -> try PATCH
                await unifiedSync.patchMe(body, token3);
              } else {
                throw e;
              }
            }
          }
          try {
            await saveUserProfileRow({
              user_id: action.payload.auth?.data?.user_id,
              ...updates,
            });
          } catch (_) {}
        } else {
          action.payload.setError("Enter valid phone number");
          setTimeout(() => {
            action.payload.setError("");
          }, 3000);
        }
      } catch (e) {
        logger.error("profile", "UPDATE_PROFILE failed", e);
      }
      break;
    }
    case "ARCHIVE_PROFILE": {
      try {
        ensureAuthAxios({
          auth: action.payload.auth,
          setAuth: action.payload.setAuth,
        });
        const authData = action.payload.auth?.data || {};
        const lsVisitor =
          (typeof localStorage !== "undefined" &&
            localStorage.getItem("visitor_id")) ||
          "";
        const bodyD = {
          profile: true,
          action: "archive",
          ...(authData.user_id || authData.id
            ? { user_id: authData.user_id || authData.id }
            : {}),
          ...(!(authData.user_id || authData.id) &&
          (authData.anon_id || lsVisitor)
            ? { anon_id: authData.anon_id || lsVisitor }
            : {}),
          ...(!(authData.user_id || authData.id) &&
          !(authData.anon_id || lsVisitor) &&
          authData.temp_id
            ? { temp_id: authData.temp_id }
            : {}),
        };
        const tokenD = action.payload.auth?.data?.access_token || null;
        try {
          await unifiedSync.deleteMe(bodyD, tokenD);
          try {
            if (typeof localStorage !== "undefined") {
              localStorage.removeItem("auth");
              localStorage.removeItem("visitor_id");
              localStorage.removeItem("user_id");
            }
          } catch (_) {}
          action.payload.setAuth(null);
        } catch (e) {
          if (e?.response?.status === 401) {
            const newAccess = await refreshAccessToken({
              auth: action.payload.auth,
              setAuth: action.payload.setAuth,
            });
            if (newAccess) {
              await unifiedSync.deleteMe(bodyD, newAccess);
              try {
                if (typeof localStorage !== "undefined") {
                  localStorage.removeItem("auth");
                  localStorage.removeItem("visitor_id");
                  localStorage.removeItem("user_id");
                }
              } catch (_) {}
              action.payload.setAuth(null);
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
      } catch (e) {
        logger.error("profile", "ARCHIVE_PROFILE failed", e);
      }
      break;
    }
    case "DELETE_PROFILE": {
      try {
        ensureAuthAxios({
          auth: action.payload.auth,
          setAuth: action.payload.setAuth,
        });
        const authData = action.payload.auth?.data || {};
        const lsVisitor =
          (typeof localStorage !== "undefined" &&
            localStorage.getItem("visitor_id")) ||
          "";
        const bodyD = {
          profile: true,
          action: "delete",
          ...(authData.user_id || authData.id
            ? { user_id: authData.user_id || authData.id }
            : {}),
          ...(!(authData.user_id || authData.id) &&
          (authData.anon_id || lsVisitor)
            ? { anon_id: authData.anon_id || lsVisitor }
            : {}),
          ...(!(authData.user_id || authData.id) &&
          !(authData.anon_id || lsVisitor) &&
          authData.temp_id
            ? { temp_id: authData.temp_id }
            : {}),
        };
        const tokenD = action.payload.auth?.data?.access_token || null;
        try {
          await unifiedSync.deleteMe(bodyD, tokenD);
          try {
            if (typeof localStorage !== "undefined") {
              localStorage.removeItem("auth");
              localStorage.removeItem("visitor_id");
              localStorage.removeItem("user_id");
            }
          } catch (_) {}
          action.payload.setAuth(null);
        } catch (e) {
          if (e?.response?.status === 401) {
            const newAccess = await refreshAccessToken({
              auth: action.payload.auth,
              setAuth: action.payload.setAuth,
            });
            if (newAccess) {
              await unifiedSync.deleteMe(bodyD, newAccess);
              try {
                if (typeof localStorage !== "undefined") {
                  localStorage.removeItem("auth");
                  localStorage.removeItem("visitor_id");
                  localStorage.removeItem("user_id");
                }
              } catch (_) {}
              action.payload.setAuth(null);
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
      } catch (e) {
        logger.error("profile", "DELETE_PROFILE failed", e);
      }
      break;
    }
    case "LOGOUT": {
      try {
        if (action.payload.auth.data.anon_id) {
          localStorage.removeItem("auth");
          action.payload.setAuth(null);
          return;
        }
        await authApi.logout(action.payload.auth.data.access_token);
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("auth");
            localStorage.removeItem("visitor_id");
            localStorage.removeItem("user_id");
          }
        } catch (_) {}
        action.payload.setAuth(null);
        try {
          await clearUserProfileRow(action.payload?.auth?.data?.user_id);
        } catch (_) {}
      } catch (e) {
        logger.error("profile", "LOGOUT failed", e);
      }
      break;
    }
    default:
      return state;
  }
  return state;
}
