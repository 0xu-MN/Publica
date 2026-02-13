import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { UploadCloud, FileText, CheckCircle, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../../lib/supabase';

interface FileUploaderProps {
    onUploadComplete: (markdown: string, fileUrl?: string) => void;
    onFileSelect?: (fileUrl: string) => void; // 🌟 Immediate Feedback Callback
    style?: any;
}

export interface FileUploaderRef {
    pickDocument: () => void;
    uploadFile: (file: File) => void;
}

export const FileUploader = forwardRef<FileUploaderRef, FileUploaderProps>(({ onUploadComplete, onFileSelect, style }, ref) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("AI 분석 준비 중...");

    useImperativeHandle(ref, () => ({
        pickDocument: () => pickAndUpload(),
        uploadFile: (file: File) => handleDirectUpload(file)
    }));

    const handleDirectUpload = async (file: File) => {
        try {
            setFileName(file.name);
            setUploading(true);
            setStatusMessage("문서 업로드 및 분석 요청 중...");

            // Create Blob URL for PDF Viewer
            const fileUrl = URL.createObjectURL(file);

            // 🌟 Trigger Immediate PDF View
            if (onFileSelect) {
                console.log("🚀 Immediate File Select Triggered (Direct Upload):", fileUrl);
                onFileSelect(fileUrl);
            }

            // 1. Base64 변환 (Web File Object)
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                await processUpload(base64, file.name, fileUrl);
            };
            reader.onerror = (error) => {
                throw new Error("File reading failed");
            };
        } catch (e: any) {
            handleError(e);
        }
    };

    const pickAndUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            const file = result.assets[0];
            setFileName(file.name);
            setUploading(true);
            setStatusMessage("문서 업로드 및 분석 요청 중...");

            let fileUrl = file.uri;
            // 🌟 Web Optimization: Generate Blob URL to prevent UI Freeze
            if (Platform.OS === 'web' && file.file) { // Expo DocumentPicker (Web) returns raw File object
                fileUrl = URL.createObjectURL(file.file);
            } else if (Platform.OS === 'web') {
                // Fallback: Fetch blob from URI if no file object available
                try {
                    const response = await fetch(file.uri);
                    const blob = await response.blob();
                    fileUrl = URL.createObjectURL(blob);
                } catch (e) {
                    console.warn("Failed to create Blob URL, using original URI", e);
                }
            }

            // 🌟 Trigger Immediate PDF View
            if (onFileSelect) {
                console.log("🚀 Immediate File Select Triggered (Picker):", fileUrl);
                onFileSelect(fileUrl);
            }

            // 1. Base64 변환
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });
            const fileBase64 = await base64Promise;

            await processUpload(fileBase64, file.name, file.uri);

        } catch (e: any) {
            handleError(e);
        }
    };

    const processUpload = async (fileBase64: string, fileName: string, fileUrl: string) => {
        // 2. 업로드 요청 (LlamaParse Job 시작)
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('publica-parser', {
            body: { action: 'upload', fileBase64, fileName }
        });

        if (uploadError) throw uploadError;
        if (!uploadData || !uploadData.success) {
            throw new Error(uploadData?.error || "Upload failed without details");
        }

        const jobId = uploadData.jobId;
        console.log(`✅ Job ID Received: ${jobId}`);

        // 3. 폴링 시작 (결과 대기)
        let attempts = 0;
        const pollInterval = setInterval(async () => {
            attempts++;
            setStatusMessage(`AI가 정밀 분석 중입니다... (${attempts * 2}초)`);

            const { data: checkData, error: checkError } = await supabase.functions.invoke('publica-parser', {
                body: { action: 'check', jobId }
            });

            if (checkError) {
                clearInterval(pollInterval);
                handleError(checkError);
                return;
            }

            console.log(`⏳ Check Status: ${checkData.status}`);

            if (checkData.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setUploading(false);
                setStatusMessage("분석 완료!");
                Alert.alert("성공", "문서 분석이 완료되었습니다.");
                // 🌟 Pass URL back to parent
                onUploadComplete(checkData.markdown, fileUrl);
            } else if (checkData.status === 'FAILED') {
                clearInterval(pollInterval);
                handleError(new Error("AI Analysis Failed"));
            } else if (attempts > 90) { // 3분 타임아웃
                clearInterval(pollInterval);
                Alert.alert("시간 초과", "분석 시간이 너무 오래 걸립니다.");
                setUploading(false);
            }
        }, 2000); // 2초마다 체크
    };

    const handleError = (e: any) => {
        console.error("❌ Error:", e);
        Alert.alert("오류", e.message || "알 수 없는 오류가 발생했습니다.");
        setUploading(false);
        setFileName(null);
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                onPress={pickAndUpload}
                disabled={uploading}
            >
                {uploading ? (
                    <>
                        <ActivityIndicator color="#10B981" style={{ marginRight: 10 }} />
                        <Text style={styles.btnText}>{statusMessage}</Text>
                    </>
                ) : fileName ? (
                    <>
                        <CheckCircle size={20} color="#10B981" />
                        <Text style={styles.btnText}>분석 완료: {fileName}</Text>
                        <TouchableOpacity onPress={() => setFileName(null)} style={{ marginLeft: 10 }}>
                            <X size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <UploadCloud size={20} color="#10B981" />
                        <Text style={styles.btnText}>LlamaParse로 정밀 분석 시작</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 20 },
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
        borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, height: 60,
    },
    uploadBtnDisabled: { opacity: 0.7, backgroundColor: '#0f172a' },
    btnText: { color: '#10B981', fontWeight: '600', marginLeft: 8, fontSize: 14 }
});