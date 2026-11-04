package com.omnitag.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String TAG = "OmniTagApp";
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILECHOOSER_RESULTCODE = 101;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        // Modern Android 120Hz hardware acceleration and butter-smooth scrolling
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(webView);

        // Enable modern webview debugging for inspection
        try {
            WebView.setWebContentsDebuggingEnabled(true);
        } catch (Exception ignored) {}

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Fast, smooth caching for mobile image feeds
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " OmniTagApp/1.3.7");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Native Android Bridge for zero-CORS booru queries & native download management
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme) || "file".equals(scheme)) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return true;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                Log.e(TAG, "WebView error: " + error.getDescription() + " for " + request.getUrl());
                super.onReceivedError(view, request, error);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && uri.getScheme() != null && uri.getScheme().startsWith("http")) {
                    String host = uri.getHost();
                    if (host != null && (host.contains("donmai.us") || host.contains("rule34.xxx") || host.contains("safebooru.org") || host.contains("tbib.org") || host.contains("yande.re") || host.contains("konachan.net"))) {
                        // For video files (.mp4, .webm), allow Android WebView / MediaPlayer to stream natively with its range request engine
                        String path = uri.getPath() != null ? uri.getPath().toLowerCase() : "";
                        if (path.endsWith(".mp4") || path.endsWith(".webm") || path.contains("video") || (host != null && host.contains("mp4"))) {
                            return super.shouldInterceptRequest(view, request);
                        }

                        try {
                            URL url = new URL(uri.toString());
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
                            if (host.contains("donmai.us")) {
                                conn.setRequestProperty("Referer", "https://danbooru.donmai.us/");
                            } else if (host.contains("rule34.xxx")) {
                                conn.setRequestProperty("Referer", "https://rule34.xxx/");
                            } else if (host.contains("safebooru.org")) {
                                conn.setRequestProperty("Referer", "https://safebooru.org/");
                            } else if (host.contains("tbib.org")) {
                                conn.setRequestProperty("Referer", "https://tbib.org/");
                            }
                            conn.setConnectTimeout(8000);
                            conn.setReadTimeout(12000);
                            int code = conn.getResponseCode();
                            if (code >= 200 && code < 300) {
                                String rawType = conn.getContentType();
                                String mimeType = (rawType != null && rawType.contains("/")) ? rawType.split(";")[0].trim() : "image/jpeg";
                                String encoding = conn.getContentEncoding();
                                Map<String, String> headers = new HashMap<>();
                                headers.put("Access-Control-Allow-Origin", "*");
                                return new WebResourceResponse(mimeType, encoding, code, "OK", headers, conn.getInputStream());
                            }
                        } catch (Exception e) {
                            Log.w(TAG, "Native request intercept error for " + uri + ": " + e.getMessage());
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, "[JS] " + consoleMessage.message() + " (" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                return super.onConsoleMessage(consoleMessage);
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Download handling for images/videos
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                triggerDownload(url, URLUtil.guessFileName(url, contentDisposition, mimeType));
            }
        });

        // Load bundled offline mobile app assets strictly without query params (fixes ERR_FILE_NOT_FOUND)
        webView.loadUrl("file:///android_asset/mobile.html");
    }

    private void triggerDownload(String url, String filename) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setDescription("Downloading file...");
            request.setTitle(filename);
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(MainActivity.this, "Downloading " + filename + "...", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(i);
            } catch (Exception ex) {
                Toast.makeText(MainActivity.this, "Download error: " + ex.getMessage(), Toast.LENGTH_LONG).show();
            }
        }
    }

    public class AndroidBridge {
        @JavascriptInterface
        public String fetchUrl(String urlString) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlString);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 OmniTagApp/1.3.7");
                conn.setRequestProperty("Accept", "application/json, text/plain, */*");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setInstanceFollowRedirects(true);

                int code = conn.getResponseCode();
                InputStream in = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (in == null) return "{\"error\": \"Empty response (code " + code + ")\"}";

                BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                reader.close();
                return sb.toString();
            } catch (Exception e) {
                Log.e(TAG, "Bridge fetch error for " + urlString, e);
                return "{\"error\": \"" + e.getMessage() + "\"}";
            } finally {
                if (conn != null) conn.disconnect();
            }
        }

        @JavascriptInterface
        public void downloadFile(String url, String filename) {
            runOnUiThread(() -> triggerDownload(url, filename));
        }

        @JavascriptInterface
        public void showToast(String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    final int numSelectedFiles = data.getClipData().getItemCount();
                    results = new Uri[numSelectedFiles];
                    for (int i = 0; i < numSelectedFiles; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
