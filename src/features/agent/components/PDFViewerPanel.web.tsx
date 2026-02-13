import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Document, Page, pdfjs } from 'react-pdf';
import { MessageSquarePlus } from 'lucide-react-native';

// 🌟 Setup Worker (Critical for Performance)
// Using unpkg CDN for the worker to avoid complex bundler config in Expo
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export interface PDFViewerRef {
    scrollToPage: (page: number) => void;
}

export const PDFViewerPanel = forwardRef<PDFViewerRef, { url: string, onQuote?: (text: string) => void }>(({ url, onQuote }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);

    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const pageLayouts = useRef<{ [page: number]: number }>({});

    useImperativeHandle(ref, () => ({
        scrollToPage: (page: number) => {
            const y = pageLayouts.current[page];
            if (y !== undefined && scrollViewRef.current) {
                console.log(`📜 Scrolling to Page ${page} at y=${y}`);
                scrollViewRef.current.scrollTo({ y, animated: true });
            } else {
                console.warn(`❌ Cannot scroll to page ${page}. Layout not found.`);
            }
        }
    }));

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setErrorDetail(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error("❌ PDF Load Error:", error);
        setErrorDetail(error.message);
    }

    // 🌟 Handle Text Selection
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
                return;
            }

            const text = sel.toString().trim();
            if (text.length > 0) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setSelection({
                    text,
                    x: rect.left + (rect.width / 2) - 60,
                    y: rect.top - 50
                });
            } else {
                setSelection(null);
            }
        };

        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('mousedown', () => { }); // Optional clear logic

        return () => {
            document.removeEventListener('mouseup', handleSelection);
        };
    }, []);

    const handleQuote = () => {
        if (selection && onQuote) {
            onQuote(selection.text);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    console.log(`[PDFViewer] Worker Src: ${pdfjs.GlobalWorkerOptions.workerSrc}`);

    return (
        <View
            style={styles.container}
            onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setContainerWidth(width);
            }}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
            >
                {url ? (
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#10B981" />
                                <Text style={styles.loadingText}>Loading PDF...</Text>
                                <Text style={{ color: '#64748B', fontSize: 10, marginTop: 4 }}>Worker: {pdfjs.version}</Text>
                            </View>
                        }
                        error={
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Failed to load PDF.</Text>
                                <Text style={styles.errorSub}>{url ? (url.length > 50 ? 'Blob URL' : url) : 'No URL'}</Text>
                                {errorDetail && (
                                    <Text style={{ color: '#EF4444', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
                                        {errorDetail}
                                    </Text>
                                )}
                            </View>
                        }
                    >
                        {numPages && Array.from(new Array(numPages), (_, index) => (
                            <View
                                key={`page_${index + 1}`}
                                style={styles.pageWrapper}
                                onLayout={(event) => {
                                    pageLayouts.current[index + 1] = event.nativeEvent.layout.y;
                                }}
                            >
                                <Page
                                    pageNumber={index + 1}
                                    width={containerWidth ? containerWidth - 40 : 500}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={false}
                                />
                            </View>
                        ))}
                    </Document>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No PDF Selected</Text>
                    </View>
                )}
            </ScrollView>

            {/* 🌟 Floating Quote Button */}
            {selection && (
                <View style={{
                    position: 'fixed' as any, // Web only
                    top: selection.y,
                    left: selection.x,
                    zIndex: 9999,
                }}>
                    <TouchableOpacity
                        onPress={handleQuote}
                        style={styles.quoteBtn}
                        activeOpacity={0.8}
                    >
                        <MessageSquarePlus size={16} color="white" style={{ marginRight: 6 }} />
                        <Text style={styles.quoteBtnText}>Quote Selection</Text>
                        <View style={styles.arrowDown} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

// 🌟 Global Styles for react-pdf (Text Layer, etc.)
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .react-pdf__Page__canvas {
            display: block;
            user-select: none;
        }
        .react-pdf__Page__textContent {
            position: absolute;
            top: 0;
            left: 0;
            transform-origin: 0 0;
            color: transparent;
            line-height: 1;
            width: 100%;
            height: 100%;
            user-select: text;
            cursor: text;
        }
        .react-pdf__Page__textContent span {
            position: absolute;
            white-space: pre;
            transform-origin: 0% 0%;
            cursor: text;
        }
        ::selection {
            background: rgba(16, 185, 129, 0.3); /* Green selection */
        }
    `;
    document.head.appendChild(style);
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#525659' }, // PDF dark background
    scrollContent: { paddingVertical: 20, alignItems: 'center' },
    pageWrapper: { marginBottom: 20, boxShadow: '0px 4px 6px rgba(0,0,0,0.3)' }, // Note: boxShadow is web-only prop
    loadingContainer: { margin: 20, alignItems: 'center' },
    loadingText: { color: 'white', marginTop: 10 },
    errorContainer: { margin: 20, alignItems: 'center' },
    errorText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
    errorSub: { color: '#FECACA', fontSize: 12, marginTop: 4 },
    placeholderContainer: { height: 500, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#9CA3AF' },

    // 🌟 Quote Button Styles
    quoteBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: 'black', shadowOpacity: 0.3, shadowRadius: 5,
        elevation: 5
    },
    quoteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    arrowDown: {
        position: 'absolute', bottom: -6, left: '50%', marginLeft: -6,
        borderTopWidth: 6, borderTopColor: '#10B981',
        borderLeftWidth: 6, borderLeftColor: 'transparent',
        borderRightWidth: 6, borderRightColor: 'transparent'
    }
});
