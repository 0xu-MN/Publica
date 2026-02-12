import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { UploadCloud, FileText, CheckCircle, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../../lib/supabase';

interface FileUploaderProps {
    onUploadComplete: (markdown: string) => void;
}

export const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("AI 분석 준비 중...");

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

            // 1. Base64 변환
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });
            const fileBase64 = await base64Promise;

            // 2. 업로드 요청 (LlamaParse Job 시작)
            const { data: uploadData, error: uploadError } = await supabase.functions.invoke('publica-parser', {
                body: { action: 'upload', fileBase64, fileName: file.name }
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
                    Alert.alert("통신 오류", "분석 상태를 확인하는 중 오류가 발생했습니다.");
                    setUploading(false);
                    return;
                }

                console.log(`⏳ Check Status: ${checkData.status}`);

                if (checkData.status === 'SUCCESS') {
                    clearInterval(pollInterval);
                    console.log("🎉 Analysis Done!");
                    onUploadComplete(checkData.markdown);
                    Alert.alert("성공", "문서 분석이 완료되었습니다!");
                    setUploading(false);
                } else if (checkData.status === 'FAILED') {
                    clearInterval(pollInterval);
                    Alert.alert("분석 실패", "LlamaParse가 문서를 처리하지 못했습니다.");
                    setUploading(false);
                } else if (attempts > 90) { // 3분 타임아웃
                    clearInterval(pollInterval);
                    Alert.alert("시간 초과", "분석 시간이 너무 오래 걸립니다.");
                    setUploading(false);
                }
            }, 2000); // 2초마다 체크

        } catch (e: any) {
            console.error("❌ Error:", e);
            Alert.alert("오류", e.message || "알 수 없는 오류가 발생했습니다.");
            setUploading(false);
            setFileName(null);
        }
    };

    return (
        <View style={styles.container}>
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
};

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