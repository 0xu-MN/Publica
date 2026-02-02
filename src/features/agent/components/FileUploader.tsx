import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { UploadCloud, FileText, CheckCircle, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../../lib/supabase'; // 수정된 경로

interface FileUploaderProps {
    onUploadComplete: (summary: string) => void;
}

export const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const pickAndUpload = async () => {
        try {
            // 1. 파일 선택
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'], // PDF나 텍스트 파일만
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setFileName(file.name);
            setUploading(true);

            // ⚠️ 실제 앱에서는 여기서 PDF -> Text 변환 로직이 필요합니다.
            // 현재는 테스트를 위해 "가짜 텍스트"를 보내거나, 텍스트 파일 내용을 읽어야 합니다.
            // (Client-side PDF parsing is heavy. For now, we simulate extraction)

            // TODO: 실제 구현 시에는 파일을 Supabase Storage에 올리고, Edge Function이 다운받아 파싱하는 것이 정석입니다.
            // 여기서는 백엔드 테스트를 위해 "파일 이름과 메타데이터"를 텍스트로 보냅니다.
            const mockExtractedText = `
                [DOCUMENT START]
                Filename: ${file.name}
                Type: Official Document
                Content: (This is a placeholder for actual PDF content extraction...)
                1. Project Overview: This document outlines the strategic roadmap for...
                2. Requirements: Must have revenue over $1M...
                [DOCUMENT END]
            `;

            // 2. 백엔드(upload-knowledge)로 전송
            const { data, error } = await supabase.functions.invoke('upload-knowledge', {
                body: {
                    text_content: mockExtractedText, // 실제로는 추출된 텍스트
                    filename: file.name
                }
            });

            if (error) throw error;

            Alert.alert("Success", "Knowledge Base Updated!");
            onUploadComplete("Document uploaded and analyzed.");

        } catch (e: any) {
            Alert.alert("Upload Failed", e.message);
            setFileName(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {!fileName ? (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#10B981" /> : <UploadCloud size={20} color="#10B981" />}
                    <Text style={styles.btnText}>{uploading ? "Analyzing..." : "Upload Context (PDF)"}</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.fileInfo}>
                    <FileText size={16} color="#94A3B8" />
                    <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                    <CheckCircle size={16} color="#10B981" style={{ marginLeft: 8 }} />
                    <TouchableOpacity onPress={() => setFileName(null)} style={{ marginLeft: 10 }}>
                        <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 10 },
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
        borderStyle: 'dashed', borderRadius: 8, padding: 12
    },
    btnText: { color: '#10B981', fontWeight: '600', marginLeft: 8, fontSize: 13 },
    fileInfo: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
        padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155'
    },
    fileName: { color: 'white', marginLeft: 8, flex: 1, fontSize: 13 }
});
