export const MSAL_CONFIG = {
    auth: {
        clientId: "758ff3e9-e6bd-4838-90d0-50cf3ec88387",
        authority: "https://login.microsoftonline.com/organizations",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true,
    },
};

export const LOGIN_REQUEST = {
    scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
};