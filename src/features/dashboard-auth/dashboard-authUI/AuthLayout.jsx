import {Outlet} from "react-router-dom";
import Container from "../Components/Container";
import {ConversationProvider} from "../../dashboard/contexts/ConversationContext";
import {VisitorLoggedInProvider} from "../../login/contexts/visitorLoggedInContext";
export default function AuthLayout() {
    return (
        <>
          <Container>
              <VisitorLoggedInProvider>
                  <ConversationProvider>
                      <Outlet/>
                  </ConversationProvider>
              </VisitorLoggedInProvider>
          </Container>
        </>
    )
}
