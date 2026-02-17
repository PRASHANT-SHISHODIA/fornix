// PdfViewer.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import FlagSecure from 'react-native-flag-secure';

const PdfViewer = ({ route }) => {
  const { pdfUrl } = route.params || {};
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android') {
      FlagSecure.activate();
      return () => FlagSecure.deactivate();
    }
  }, []);

  if (!pdfUrl) return null;

  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    pdfUrl
  )}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* PDF CARD */}
      <View style={styles.card}>
        <WebView
          source={{ uri: viewerUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          cacheEnabled={false}
          allowsLinkPreview={false}
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          onLoadEnd={() => setLoading(false)}
          injectedJavaScript={`
            // Disable copy / select / menu
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('selectstart', e => e.preventDefault());
            document.addEventListener('copy', e => e.preventDefault());

            // Disable zoom
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            document.head.appendChild(meta);

            // Hide Share / Pop-out buttons
            const style = document.createElement('style');
            style.innerHTML = '.ndfHFb-c4SVe-L97Feb-ai7Q9c, [aria-label="Pop-out"], [title="Pop-out"], .ndfHFb-c4SVe-nS1pS-Xm7s6e, .ndfHFb-c4SVe-pInS9 { display: none !important; }';
            document.head.appendChild(style);

            document.body.style.background = '#f8fafc';
            document.body.style.margin = '0';
            true;
          `}
        />

        {/* LOADER */}
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
      </View>
    </View>
  );
};

export default PdfViewer;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // dark background
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },

  card: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  webview: {
    flex: 1,
  },

  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
