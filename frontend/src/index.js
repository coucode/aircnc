import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ModalProvider } from "./context/Modal";
import { ReviewModalProvider } from "./context/ReviewModal";
import { ConfirmModalProvider } from "./context/ConfirmModal";
import { SwitchModalContextProvider } from "./context/SwitchModalContext";


import configureStore from "./store";
import { restoreCSRF, csrfFetch } from "./store/csrf";
import * as sessionActions from "./store/session";

const store = configureStore();


if (process.env.NODE_ENV !== 'production') {
  restoreCSRF();

  window.csrfFetch = csrfFetch;
  window.store = store;
  window.sessionActions = sessionActions;
}

function Root() {
  return (
    <div className="root">
      <Provider store={store}>
        <ModalProvider>
          <ReviewModalProvider>
            <ConfirmModalProvider>
              <SwitchModalContextProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </SwitchModalContextProvider>
            </ConfirmModalProvider>
          </ReviewModalProvider>
        </ModalProvider>
      </Provider>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root'),
);
