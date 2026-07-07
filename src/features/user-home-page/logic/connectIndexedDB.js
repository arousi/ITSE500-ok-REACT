import logger from '../../../core/logger';
// Bump version to 5 when adding new object stores (e.g., 'profile')
const request = indexedDB.open("conversations-db",5);
let db ;
request.onerror = (event) => {
    console.error("error");
}
request.onsuccess = (event) => {
    db = event.target.result;
    logger.debug("idb", "success"+db);
}
// local only DB for a web
request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion || 0;
        const upgradeTx = event.target.transaction;

        // إنشاء المخازن إن لم تكن موجودة
        if (!db.objectStoreNames.contains('user')) {
            const userStore = db.createObjectStore('user', { keyPath: 'user_id' });
            userStore.createIndex('user_id', 'user_id');
        }
        if (!db.objectStoreNames.contains('visitor')) {
            const visitorStore = db.createObjectStore('visitor', { keyPath: 'visitor_id' });
            visitorStore.createIndex('visitor_id', 'visitor_id');
        }
        if (!db.objectStoreNames.contains('conversations')) {
            const conversationsStore = db.createObjectStore('conversations', { keyPath: 'conversation_id' });
            // فهارس (قد تكون زائدة لكنها لا تضر)
            conversationsStore.createIndex('conversation_id', 'conversation_id');
            conversationsStore.createIndex('user_id', 'user_id');
            conversationsStore.createIndex('visitor_id', 'visitor_id');
        } else {
            const conversationsStore = upgradeTx.objectStore('conversations');
            try { conversationsStore.createIndex('user_id', 'user_id'); } catch (e) {}
            try { conversationsStore.createIndex('visitor_id', 'visitor_id'); } catch (e) {}
        }

        if (!db.objectStoreNames.contains('messages')) {
            const messagesStore = db.createObjectStore('messages', { keyPath: 'message_id' });
            messagesStore.createIndex('message_id', 'message_id');
            messagesStore.createIndex('conversation_id', 'conversation_id');
            // إضافة فهارس المستخدم/الزائر عند الإنشاء
            messagesStore.createIndex('user_id','user_id');
            messagesStore.createIndex('visitor_id','visitor_id');
        } else {
            const messagesStore = upgradeTx.objectStore('messages');
            try { messagesStore.createIndex('conversation_id', 'conversation_id'); } catch (e) {}
            try { messagesStore.createIndex('user_id','user_id'); } catch (e) {}
            try { messagesStore.createIndex('visitor_id','visitor_id'); } catch (e) {}
        }

        // attachments store: keyPath attachment_id, index by message_id and conversation_id for fast lookups
        if (!db.objectStoreNames.contains('attachments')) {
            const attachmentsStore = db.createObjectStore('attachments', { keyPath: 'attachment_id' });
            attachmentsStore.createIndex('attachment_id', 'attachment_id');
            attachmentsStore.createIndex('message_id', 'message_id');
            attachmentsStore.createIndex('conversation_id', 'conversation_id');
        } else {
            const attachmentsStore = upgradeTx.objectStore('attachments');
            try { attachmentsStore.createIndex('message_id', 'message_id'); } catch (e) {}
            try { attachmentsStore.createIndex('conversation_id', 'conversation_id'); } catch (e) {}
        }

        // message_requests: فرض one-to-one عبر فهرس فريد على message_id
        if (!db.objectStoreNames.contains('message_requests')) {
            const messageRequestsStore = db.createObjectStore('message_requests', { keyPath: 'request_id' });
            messageRequestsStore.createIndex('request_id', 'request_id');
            messageRequestsStore.createIndex('message_id', 'message_id', { unique: true });
        } else {
            const messageRequestsStore = upgradeTx.objectStore('message_requests');
            try { messageRequestsStore.deleteIndex('message_id'); } catch (e) {}
            try { messageRequestsStore.createIndex('message_id', 'message_id', { unique: true }); } catch (e) {}
        }

        // message_responses: فرض one-to-one عبر فهرس فريد على message_id
        if (!db.objectStoreNames.contains('message_responses')) {
            const messageResponsesStore = db.createObjectStore('message_responses', { keyPath: 'response_id' });
            messageResponsesStore.createIndex('response_id', 'response_id');
            messageResponsesStore.createIndex('message_id', 'message_id', { unique: true });
        } else {
            const messageResponsesStore = upgradeTx.objectStore('message_responses');
            try { messageResponsesStore.deleteIndex('message_id'); } catch (e) {}
            try { messageResponsesStore.createIndex('message_id', 'message_id', { unique: true }); } catch (e) {}
        }

        // message_outputs: تصحيح المفتاح الأساسي إلى output_id وفرض one-to-one
        if (db.objectStoreNames.contains('message_outputs')) {
            if (oldVersion < 2) {
                // إعادة إنشاء المخزن بمفتاح صحيح
                db.deleteObjectStore('message_outputs');
                const messageOutputStore = db.createObjectStore('message_outputs', { keyPath: 'output_id' });
                messageOutputStore.createIndex('output_id', 'output_id');
                messageOutputStore.createIndex('message_id', 'message_id', { unique: true });
            } else {
                const messageOutputStore = upgradeTx.objectStore('message_outputs');
                try { messageOutputStore.createIndex('output_id', 'output_id'); } catch (e) {}
                try { messageOutputStore.deleteIndex('message_id'); } catch (e) {}
                try { messageOutputStore.createIndex('message_id', 'message_id', { unique: true }); } catch (e) {}
            }
        } else {
            const messageOutputStore = db.createObjectStore('message_outputs', { keyPath: 'output_id' });
            messageOutputStore.createIndex('output_id', 'output_id');
            messageOutputStore.createIndex('message_id', 'message_id', { unique: true });
        }

        // settings: تخزين إعدادات المحادثة لكل مستخدم/زائر
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'settings_id' });
            settingsStore.createIndex('settings_id', 'settings_id');
            settingsStore.createIndex('user_id', 'user_id', { unique: false });
            settingsStore.createIndex('visitor_id', 'visitor_id', { unique: false });
        } else {
            try {
                const settingsStore = upgradeTx.objectStore('settings');
                try { settingsStore.createIndex('user_id', 'user_id', { unique: false }); } catch (e) {}
                try { settingsStore.createIndex('visitor_id', 'visitor_id', { unique: false }); } catch (e) {}
            } catch (e) { /* ignore */ }
        }

        // profile: cache user profile by user_id for fast rehydration on reload
        if (!db.objectStoreNames.contains('profile')) {
            const profileStore = db.createObjectStore('profile', { keyPath: 'user_id' });
            profileStore.createIndex('user_id', 'user_id');
        }
}
export function refreshConversations(conversations , messages , message_requests , message_responses , message_outputs, attachments = []){
    if (!db) {
        console.error("Database is not initialized.");
        return;
    }

    // إنشاء عملية `Transaction` تشمل كل الجداول
    const transaction = db.transaction(["conversations", "messages", "message_requests", "message_responses", "message_outputs", "attachments"], "readwrite");

    // مرجع لكل الجداول
    const conversationsStore = transaction.objectStore("conversations");
    const messagesStore = transaction.objectStore("messages");
    const messageRequestsStore = transaction.objectStore("message_requests");
    const messageResponsesStore = transaction.objectStore("message_responses");
    const messageOutputsStore = transaction.objectStore("message_outputs");
    const attachmentsStore = transaction.objectStore("attachments");

    // دالة مساعدة لإضافة البيانات بعد التحقق من وجودها
    const addIfNotExists = (store, item, key) => {
        // حاول إيجاد العنصر بناءً على مفتاح التعريف
        const getRequest = store.get(item[key]);
        getRequest.onsuccess = (event) => {
            if (!event.target.result) {
                // في حال عدم وجود العنصر، قم بإضافته
                store.add(item);
            }
        };
    };

    // فلترة المصفوفات للتأكد من عدم تكرار المعرفات داخليًا
    const uniqueById = (array, idField) => [...new Map(array.map(item => [item[idField], item])).values()];

    const filteredConversations = uniqueById(conversations, "conversation_id");
    const filteredMessages = uniqueById(messages, "message_id");
    const filteredMessageRequests = uniqueById(message_requests, "request_id");
    const filteredMessageResponses = uniqueById(message_responses, "response_id");
    const filteredMessageOutputs = uniqueById(message_outputs, "output_id");
    const filteredAttachments = uniqueById(attachments, "attachment_id");

    // التحقق من كل عنصر في المصفوفة وإضافته إذا لم يكن موجودًا
    filteredConversations.forEach(conversation => addIfNotExists(conversationsStore, conversation, "conversation_id"));
    filteredMessages.forEach(message => addIfNotExists(messagesStore, message, "message_id"));
    filteredMessageRequests.forEach(request => addIfNotExists(messageRequestsStore, request, "request_id"));
    filteredMessageResponses.forEach(response => addIfNotExists(messageResponsesStore, response, "response_id"));
    filteredMessageOutputs.forEach(output => addIfNotExists(messageOutputsStore, output, "output_id"));
    filteredAttachments.forEach(att => addIfNotExists(attachmentsStore, att, "attachment_id"));

    // إنهاء العملية
    transaction.oncomplete = () => {
        logger.debug("idb", filteredConversations);
        logger.debug("idb", filteredMessages);
        logger.debug("idb", filteredMessageRequests);
    logger.debug("idb", "All data filtered and added successfully.");
    };
    transaction.onerror = (event) => {
        console.error("Transaction error: ", event.target.error);
    };

}
export function readAllConversations(){
    // إرجاع جميع البيانات من الجداول المحددة كمصفوفات داخل كائن JSON واحد
    const ensureDb = () => new Promise((resolve, reject) => {
        if (db) return resolve(db);

        // في حال كان الطلب قد أُنجز لكن db لم تُعين بعد
        if (request && request.readyState === 'done' && request.result) {
            db = request.result;
            return resolve(db);
        }

        if (request) {
            request.addEventListener('success', (event) => {
                db = event.target.result;
                resolve(db);
            }, { once: true });
            request.addEventListener('error', (event) => {
                reject(event.target.error || new Error('Failed to open IndexedDB'));
            }, { once: true });
        } else {
            reject(new Error('IndexedDB open request is not available'));
        }
    });

    const getAllFromStore = (store) => new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    return ensureDb().then((database) => {
        const tx = database.transaction(
            ["conversations", "messages", "message_requests", "message_responses", "message_outputs", "attachments"],
            "readonly"
        );

        const conversationsStore = tx.objectStore("conversations");
        const messagesStore = tx.objectStore("messages");
        const messageRequestsStore = tx.objectStore("message_requests");
        const messageResponsesStore = tx.objectStore("message_responses");
    const messageOutputsStore = tx.objectStore("message_outputs");
    const attachmentsStore = tx.objectStore("attachments");

        return Promise.all([
            getAllFromStore(conversationsStore),
            getAllFromStore(messageRequestsStore),
            getAllFromStore(messageResponsesStore),
            getAllFromStore(messagesStore),
            getAllFromStore(messageOutputsStore),
            getAllFromStore(attachmentsStore)
        ]).then(([conversations, message_requests, message_responses, messages, message_outputs, attachments]) => {
            return { conversations, message_requests, message_responses, messages, message_outputs, attachments };
        });
    });
}
// Read one conversation and all its related rows filtered by conversation_id
export function readConversationBundle(conversation_id, { user_id = '', visitor_id = '' } = {}){
    if (!conversation_id) return Promise.resolve(null);

    // Reuse the same ensureDb logic from readAllConversations
    const ensureDb = () => new Promise((resolve, reject) => {
        if (db) return resolve(db);
        if (request && request.readyState === 'done' && request.result) {
            db = request.result;
            return resolve(db);
        }
        if (request) {
            request.addEventListener('success', (event) => {
                db = event.target.result;
                resolve(db);
            }, { once: true });
            request.addEventListener('error', (event) => {
                reject(event.target.error || new Error('Failed to open IndexedDB'));
            }, { once: true });
        } else {
            reject(new Error('IndexedDB open request is not available'));
        }
    });

    const getAllFromStore = (store) => new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    return ensureDb().then((database) => {
        const tx = database.transaction(
            ["conversations", "messages", "message_requests", "message_responses", "message_outputs", "attachments"],
            "readonly"
        );
        const conversationsStore = tx.objectStore("conversations");
        const messagesStore = tx.objectStore("messages");
        const requestsStore = tx.objectStore("message_requests");
        const responsesStore = tx.objectStore("message_responses");
    const outputsStore = tx.objectStore("message_outputs");
    const attachmentsStore = tx.objectStore("attachments");

        return Promise.all([
            getAllFromStore(conversationsStore),
            getAllFromStore(messagesStore),
            getAllFromStore(requestsStore),
            getAllFromStore(responsesStore),
            getAllFromStore(outputsStore),
            getAllFromStore(attachmentsStore)
        ]).then(([allConversations, allMessages, allRequests, allResponses, allOutputs, allAttachments]) => {
            const conversation = (allConversations || []).find(c => c.conversation_id === conversation_id) || null;
            if (!conversation) return null;

            // Enforce owner scoping if provided
            if (user_id) {
                if (conversation.user_id !== user_id) return null;
            } else if (visitor_id) {
                // Only allow visitor-owned conversations when no user_id is set on the row
                if (conversation.visitor_id !== visitor_id || conversation.user_id) return null;
            }
            const messages = (allMessages || []).filter(m => m.conversation_id === conversation_id);
            const messageIds = new Set(messages.map(m => m.message_id));
            const message_requests = (allRequests || []).filter(r => messageIds.has(r.message_id));
            const message_responses = (allResponses || []).filter(r => messageIds.has(r.message_id));
            const message_outputs = (allOutputs || []).filter(o => messageIds.has(o.message_id));
            const attachments = (allAttachments || []).filter(a => messageIds.has(a.message_id));

            return { conversation, messages, message_requests, message_responses, message_outputs, attachments };
        });
    });
}
export function deleteConversation(conversation_id){
    if (!db) {
        return Promise.reject(new Error('DB not initialized'));
    }

    return new Promise((resolve, reject) => {
    const transaction = db.transaction(['conversations', 'messages', 'message_requests', 'message_responses', 'message_outputs', 'attachments'], 'readwrite');
        const conversationsStore = transaction.objectStore('conversations');
        const messagesStore = transaction.objectStore('messages');
        const requestsStore = transaction.objectStore('message_requests');
        const responsesStore = transaction.objectStore('message_responses');
    const outputsStore = transaction.objectStore('message_outputs');
    const attachmentsStore = transaction.objectStore('attachments');

        // 1) اجلب كل الرسائل التابعة للمحادثة عبر فهرس conversation_id
        let msgs = [];
        try {
            const idx = messagesStore.index('conversation_id');
            const getAllReq = idx.getAll(conversation_id);
            getAllReq.onsuccess = () => {
                msgs = getAllReq.result || [];

                // 2) احذف كل الرسائل وسجلاتها المرتبطة عبر message_id
                msgs.forEach((msg) => {
                    const mid = msg.message_id;
                    // حذف الرسالة
                    try { messagesStore.delete(mid); } catch (e) { /* ignore */ }

                    // message_requests (مفهرس بـ message_id فريد)
                    try {
                        const r1 = requestsStore.index('message_id').get(mid);
                        r1.onsuccess = () => { const row = r1.result; if (row) { try { requestsStore.delete(row.request_id); } catch (e) {} } };
                    } catch (e) { /* ignore */ }

                    // message_responses
                    try {
                        const r2 = responsesStore.index('message_id').get(mid);
                        r2.onsuccess = () => { const row = r2.result; if (row) { try { responsesStore.delete(row.response_id); } catch (e) {} } };
                    } catch (e) { /* ignore */ }

                    // message_outputs
                    try {
                        const r3 = outputsStore.index('message_id').get(mid);
                        r3.onsuccess = () => { const row = r3.result; if (row) { try { outputsStore.delete(row.output_id); } catch (e) {} } };
                    } catch (e) { /* ignore */ }

                    // attachments
                    try {
                        const r4 = attachmentsStore.index('message_id').getAll(mid);
                        r4.onsuccess = () => {
                            const rows = r4.result || [];
                            rows.forEach((a) => { try { attachmentsStore.delete(a.attachment_id); } catch (e) {} });
                        };
                    } catch (e) { /* ignore */ }
                });

                // 3) أخيراً احذف صف المحادثة
                try { conversationsStore.delete(conversation_id); } catch (e) { /* ignore */ }
            };
            getAllReq.onerror = () => {
                // حتى لو فشل جلب الرسائل، حاول حذف المحادثة نفسها
                try { conversationsStore.delete(conversation_id); } catch (e) { /* ignore */ }
            };
        } catch (e) {
            // في حال غياب الفهرس لسبب ما، احذف المحادثة فقط
            try { conversationsStore.delete(conversation_id); } catch (_) {}
        }

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = (event) => reject(event.target.error);
        transaction.onabort = (event) => reject(event.target.error);
    });
}
export function deleteAllConversations(){
    if (!db) return Promise.resolve();

    return new Promise((resolve, reject) => {
    const tx = db.transaction(["conversations", "messages", "message_requests", "message_responses", "message_outputs", "attachments"], "readwrite");
        const conversationsStore = tx.objectStore("conversations");
        const messagesStore = tx.objectStore("messages");
        const requestsStore = tx.objectStore("message_requests");
        const responsesStore = tx.objectStore("message_responses");
    const outputsStore = tx.objectStore("message_outputs");
    const attachmentsStore = tx.objectStore("attachments");

        const deleteAll = (store) => {
            return new Promise((res, rej) => {
                const req = store.clear();
                req.onsuccess = () => res();
                req.onerror = () => rej(req.error);
            });
        };

        Promise.all([
            deleteAll(conversationsStore),
            deleteAll(messagesStore),
            deleteAll(requestsStore),
            deleteAll(responsesStore),
            deleteAll(outputsStore),
            deleteAll(attachmentsStore)
        ]).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        });
    });
}

// Update a conversation's title (and optionally updated_at) by key
export function updateConversationTitle(conversation_id, title, updated_at = null){
    if (!db) return Promise.reject(new Error('DB not initialized'));
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['conversations'], 'readwrite');
        const store = tx.objectStore('conversations');
        const getReq = store.get(conversation_id);
        getReq.onsuccess = () => {
            const existing = getReq.result;
            if (!existing) { resolve(false); return; }
            const updated = { ...existing, title: title || existing.title };
            if (updated_at) updated.updated_at = updated_at;
            const putReq = store.put(updated);
            putReq.onsuccess = () => resolve(true);
            putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

// Read all records but scoped to a specific owner (user_id or visitor_id)
export function readAllConversationsForOwner({ user_id = '', visitor_id = '' } = {}){
    const ensureDb = () => new Promise((resolve, reject) => {
        if (db) return resolve(db);
        if (request && request.readyState === 'done' && request.result) {
            db = request.result;
            return resolve(db);
        }
        if (request) {
            request.addEventListener('success', (event) => {
                db = event.target.result;
                resolve(db);
            }, { once: true });
            request.addEventListener('error', (event) => {
                reject(event.target.error || new Error('Failed to open IndexedDB'));
            }, { once: true });
        } else {
            reject(new Error('IndexedDB open request is not available'));
        }
    });

    const getAllFromStore = (store) => new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const matchOwner = (row) => {
        if (!row) return false;
        // When a logged-in user is present, return ONLY items owned by that user
        if (user_id) return row.user_id === user_id;
        // When only a visitor_id is present, return ONLY items owned by that visitor
        if (visitor_id) return row.visitor_id === visitor_id && !row.user_id; // avoid surfacing user-owned rows in visitor scope
        return false;
    };

    return ensureDb().then((database) => {
        const tx = database.transaction(
            ["conversations", "messages", "message_requests", "message_responses", "message_outputs", "attachments"],
            "readonly"
        );

        const conversationsStore = tx.objectStore("conversations");
        const messagesStore = tx.objectStore("messages");
        const messageRequestsStore = tx.objectStore("message_requests");
        const messageResponsesStore = tx.objectStore("message_responses");
    const messageOutputsStore = tx.objectStore("message_outputs");
    const attachmentsStore = tx.objectStore("attachments");

        return Promise.all([
            getAllFromStore(conversationsStore),
            getAllFromStore(messageRequestsStore),
            getAllFromStore(messageResponsesStore),
            getAllFromStore(messagesStore),
            getAllFromStore(messageOutputsStore),
            getAllFromStore(attachmentsStore)
        ]).then(([conversations, message_requests, message_responses, messages, message_outputs, attachments]) => {
            const all = {
                conversations: conversations || [],
                messages: messages || [],
                message_requests: message_requests || [],
                message_responses: message_responses || [],
                message_outputs: message_outputs || [],
                attachments: attachments || []
            };

            // If no owner provided, return all (legacy/debug path)
            if (!user_id && !visitor_id) {
                return all;
            }

            // Apply owner filtering
            const convs = (all.conversations || []).filter(matchOwner);
            const msgs = (all.messages || []).filter(matchOwner);
            const msgIds = new Set(msgs.map(m => m.message_id));
            const reqs = (all.message_requests || []).filter((r)=> msgIds.has(r.message_id));
            const resps = (all.message_responses || []).filter((r)=> msgIds.has(r.message_id));
            const outs = (all.message_outputs || []).filter((o)=> msgIds.has(o.message_id));
            const atts = (all.attachments || []).filter((a)=> msgIds.has(a.message_id));

            return { conversations: convs, message_requests: reqs, message_responses: resps, messages: msgs, message_outputs: outs, attachments: atts };
        });
    });
}

// -------- Settings helpers (save/read) --------
const ensureDbCommon = () => new Promise((resolve, reject) => {
    if (db) return resolve(db);
    if (request && request.readyState === 'done' && request.result) {
        db = request.result;
        return resolve(db);
    }
    if (request) {
        request.addEventListener('success', (event) => {
            db = event.target.result;
            resolve(db);
        }, { once: true });
        request.addEventListener('error', (event) => {
            reject(event.target.error || new Error('Failed to open IndexedDB'));
        }, { once: true });
    } else {
        reject(new Error('IndexedDB open request is not available'));
    }
});

export function saveSettingsForOwner(settings, { user_id = '', visitor_id = '' } = {}){
    const settings_id = user_id ? `user:${user_id}` : (visitor_id ? `visitor:${visitor_id}` : 'local');
    const row = {
        settings_id,
        user_id: user_id || '',
        visitor_id: visitor_id || '',
        ...settings,
        updated_at: new Date().toISOString()
    };
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(['settings'], 'readwrite');
            const store = tx.objectStore('settings');
            const putReq = store.put(row);
            putReq.onsuccess = () => resolve(row);
            putReq.onerror = () => reject(putReq.error);
        } catch (e) { reject(e); }
    }));
}

// -------- Profile persistence (User profile) --------
// Ensure required stores exist; if not, reopen DB at the current version to trigger upgrade
function ensureDbWithStores(requiredStores = []){
    const version = 5;
    const hasStores = (database) => requiredStores.every((s) => database?.objectStoreNames?.contains(s));
    if (db && hasStores(db)) return Promise.resolve(db);
    // If db exists but missing stores (HMR scenario), close and reopen to run upgrade
    if (db && !hasStores(db)) {
        try { db.close(); } catch (_) {}
    }
    return new Promise((resolve, reject) => {
        try {
            const req = indexedDB.open('conversations-db', version);
            req.onupgradeneeded = (event) => {
                const database = event.target.result;
                // Create missing stores defensively
                requiredStores.forEach((name) => {
                    if (!database.objectStoreNames.contains(name)) {
                        if (name === 'profile') {
                            const st = database.createObjectStore('profile', { keyPath: 'user_id' });
                            st.createIndex('user_id', 'user_id');
                        }
                    }
                });
            };
            req.onsuccess = (event) => {
                db = event.target.result;
                if (!hasStores(db)) {
                    reject(new Error('Required stores not available'));
                } else {
                    resolve(db);
                }
            };
            req.onerror = (e) => reject(req.error || e);
        } catch (e) { reject(e); }
    });
}

export function saveUserProfileRow(profileRow = {}) {
    const user_id = profileRow?.user_id || profileRow?.data?.user_id || '';
    if (!user_id) return Promise.resolve(null);
    const row = {
        user_id,
        ...profileRow,
        updated_at: new Date().toISOString()
    };
    return ensureDbWithStores(['profile']).then((database) => new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(['profile'], 'readwrite');
            const store = tx.objectStore('profile');
            const putReq = store.put(row);
            putReq.onsuccess = () => resolve(row);
            putReq.onerror = () => reject(putReq.error);
        } catch (e) { reject(e); }
    }));
}

export function readUserProfileRow(user_id) {
    if (!user_id) return Promise.resolve(null);
    return ensureDbWithStores(['profile']).then((database) => new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(['profile'], 'readonly');
            const store = tx.objectStore('profile');
            const getReq = store.get(user_id);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => reject(getReq.error);
        } catch (e) { reject(e); }
    }));
}

export function clearUserProfileRow(user_id = '') {
    return ensureDbWithStores(['profile']).then((database) => new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(['profile'], 'readwrite');
            const store = tx.objectStore('profile');
            if (user_id) {
                const req = store.delete(user_id);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            } else {
                const req = store.clear();
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            }
        } catch (e) { reject(e); }
    }));
}

// -------- Auth persistence (User) --------
// Save or update a user auth row. Expects an object with data.user_id or user_id.
export function saveUserAuthRow(authRow = {}) {
    const user_id = authRow?.data?.user_id || authRow?.user_id || '';
    if (!user_id) return Promise.resolve(null);
    const row = {
        user_id,
        ...authRow,
        updated_at: new Date().toISOString()
    };
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['user'], 'readwrite');
        const store = tx.objectStore('user');
        const req = store.put(row);
        req.onsuccess = () => resolve(row);
        req.onerror = () => reject(req.error);
    }));
}

// Read a user auth row by user_id
export function readUserAuthRow(user_id) {
    if (!user_id) return Promise.resolve(null);
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['user'], 'readonly');
        const store = tx.objectStore('user');
        const req = store.get(user_id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    }));
}

// Read the first available user auth row (useful when you don't know the id upfront)
export function readAnyUserAuthRow() {
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['user'], 'readonly');
        const store = tx.objectStore('user');
        const req = store.getAll();
        req.onsuccess = () => {
            const arr = req.result || [];
            resolve(arr[0] || null);
        };
        req.onerror = () => reject(req.error);
    }));
}

// Clear a specific user auth row (or all if no id)
export function clearUserAuthRow(user_id = '') {
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['user'], 'readwrite');
        const store = tx.objectStore('user');
        if (user_id) {
            const req = store.delete(user_id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        } else {
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        }
    }));
}

// -------- Auth persistence (Visitor/Guest) --------
// Save or update a visitor auth row. Expects an object with data.anon_id or anon_id.
export function saveVisitorAuthRow(visitorRow = {}) {
    const anon_id = visitorRow?.data?.anon_id || visitorRow?.anon_id || '';
    if (!anon_id) return Promise.resolve(null);
    const row = {
        visitor_id: anon_id, // match store keyPath
        data: visitorRow?.data ? visitorRow.data : {
            anon_id: anon_id,
            device_id: visitorRow?.data?.device_id || visitorRow?.device_id || '',
            date_joined: visitorRow?.data?.date_joined || visitorRow?.date_joined || new Date().toISOString()
        },
        updated_at: new Date().toISOString()
    };
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['visitor'], 'readwrite');
        const store = tx.objectStore('visitor');
        const req = store.put(row);
        req.onsuccess = () => resolve(row);
        req.onerror = () => reject(req.error);
    }));
}

// Read a visitor auth row by visitor_id (anon_id)
export function readVisitorAuthRow(visitor_id) {
    if (!visitor_id) return Promise.resolve(null);
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['visitor'], 'readonly');
        const store = tx.objectStore('visitor');
        const req = store.get(visitor_id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    }));
}

// Read the first available visitor auth row
export function readAnyVisitorAuthRow() {
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['visitor'], 'readonly');
        const store = tx.objectStore('visitor');
        const req = store.getAll();
        req.onsuccess = () => {
            const arr = req.result || [];
            resolve(arr[0] || null);
        };
        req.onerror = () => reject(req.error);
    }));
}

// Clear a specific visitor auth row (or all if no id)
export function clearVisitorAuthRow(visitor_id = '') {
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        const tx = database.transaction(['visitor'], 'readwrite');
        const store = tx.objectStore('visitor');
        if (visitor_id) {
            const req = store.delete(visitor_id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        } else {
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        }
    }));
}

export function readSettingsForOwner({ user_id = '', visitor_id = '' } = {}){
    const settings_id = user_id ? `user:${user_id}` : (visitor_id ? `visitor:${visitor_id}` : 'local');
    return ensureDbCommon().then((database) => new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(['settings'], 'readonly');
            const store = tx.objectStore('settings');
            const getReq = store.get(settings_id);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => reject(getReq.error);
        } catch (e) { reject(e); }
    }));
}
