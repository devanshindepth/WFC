import { createClient } from "@supabase/supabase-js";
import localforage from "localforage";

try {
  (async () => {
    // Use your actual Supabase credentials
    const SUPABASE_URL = "https://ilustgztkemrfcqbufjb.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdXN0Z3p0a2VtcmZjcWJ1ZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjU4NzUsImV4cCI6MjA3MjMwMTg3NX0.VoxnWeqYiSno5r_gpoFAY4kWBj43FufEmrK56Czz7vc";

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: fetch.bind(globalThis) },
      auth: {
        storage: localforage,
        persistSession: true,
      },
    });

    // Google OAuth function
    const handleGoogleLogin = async () => {
      const manifest = chrome.runtime.getManifest();
      const url = new URL('https://accounts.google.com/o/oauth2/auth');

      url.searchParams.set('client_id', manifest.oauth2.client_id);
      url.searchParams.set('response_type', 'id_token');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('redirect_uri', `https://${chrome.runtime.id}.chromiumapp.org`);
      url.searchParams.set('scope', manifest.oauth2.scopes.join(' '));

      return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: url.href,
            interactive: true,
          },
          async (redirectedTo) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              try {
                // Extract the ID token from the redirectedTo URL
                const url = new URL(redirectedTo);
                const params = new URLSearchParams(url.hash.substring(1)); // Remove the # from hash

                const idToken = params.get('id_token');
                
                if (!idToken) {
                  reject(new Error('No ID token found'));
                  return;
                }

                // Sign in with Supabase using the Google ID token
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: idToken,
                });

                if (error) {
                  reject(error);
                } else {
                  resolve(data);
                }
              } catch (err) {
                reject(err);
              }
            }
          }
        );
      });
    };

    // Message handler function (from your bg-supa.js)
    const handleMessage = async function (msg, sender, response) {
      console.log("handle message from", sender);
      
      if (msg.command == "logoutAuth") {
        let { error } = await supabase.auth.signOut();
        response({ type: "un-auth", status: "success", message: true });
      }
      
      if (msg.command == "checkAuth") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          // User is signed in
          console.log("do we have a user", { user });
          let { data: example, error } = await supabase
            .from("example")
            .select("*");

          response({
            type: "auth",
            status: "success",
            message: user,
            data: example,
            error: error,
          });
        } else {
          // No user is signed in
          response({ type: "auth", status: "no-auth", message: false });
        }
      }
      
      if (msg.command == "loginUser") {
        var email = msg.data.e;
        var pass = msg.data.p;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: pass,
        });

        const user = data?.user || null;

        if (user) {
          console.log("user", user);
          response({ type: "auth", status: "success", message: user });
        } else {
          console.log("error", error);
          response({ type: "auth", status: "no-auth", message: false, error: error });
        }
      }
      
      if (msg.command == "signupUser") {
        console.log(msg.data);
        var email = msg.data.e;
        var pass = msg.data.p;
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: pass,
        });
        const user = data?.user || null;

        if (user) {
          console.log("user", user);
          response({ type: "auth", status: "success", message: user });
        } else {
          console.log("error", error);
          response({ type: "auth", status: "no-auth", message: false, error: error });
        }
      }

      // New Google login handler
      if (msg.command == "googleLogin") {
        try {
          const data = await handleGoogleLogin();
          const user = data?.user || null;
          
          if (user) {
            console.log("Google login successful", user);
            response({ type: "auth", status: "success", message: user });
          } else {
            response({ type: "auth", status: "no-auth", message: false });
          }
        } catch (error) {
          console.log("Google login error", error);
          response({ type: "auth", status: "no-auth", message: false, error: error });
        }
      }
      
      return true;
    };

    // Listen for messages
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      handleMessage(msg, sender, response);
      return true; // Keep the message channel open for async response
    });

  })();
} catch (e) {
  console.log("error", e);
}

// Create context menu for Read Mode
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "readMode",
    title: "Read Mode - Extract Legal Text",
    contexts: ["page", "selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "readMode") {
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).then(() => {
      // Send message to extract legal text
      chrome.tabs.sendMessage(tab.id, {
        action: "extractLegalText",
        selectedText: info.selectionText || null
      }, (response) => {
        if (response && response.success) {
          // Store the extracted data using keys that viewer.js expects
          chrome.storage.local.set({
            // CHANGE: 'legalText' is now 'extractedText'
            extractedText: response.text,
            // CHANGE: 'sourceTitle' is now 'extractedTitle'
            extractedTitle: tab.title, 
            timestamp: Date.now(),
            // You can also store the URL if needed later
            sourceUrl: tab.url 
          }, () => {
            // Open the main viewer instead of the old readmode page
            chrome.tabs.create({
              // CHANGE: The URL now points to viewer.html
              url: chrome.runtime.getURL("viewer.html") 
            });
          });
        }
      });
    }).catch(error => {
      console.error("Failed to inject content script:", error);
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openReadMode") {
    chrome.storage.local.set({
      legalText: request.text,
      sourceUrl: request.url,
      sourceTitle: request.title,
      timestamp: Date.now()
    }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("readmode.html")
      });
    });
  }
});