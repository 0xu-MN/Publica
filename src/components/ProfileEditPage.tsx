import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { X, Building2, ChevronRight, Briefcase, Plus, Trash2, Award, Camera, RotateCcw, Save } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { JOB_CATEGORIES } from '../utils/profileConstants';

interface ProfileEditPageProps {
    onClose: () => void;
    onSave: () => void;
}

interface CareerEntry {
    id: string; company: string; role: string; period: string; description: string;
}

interface QualificationEntry {
    id: string; type: 'certification' | 'activity' | 'award'; title: string; issuer: string; date: string;
}

const LOCATION_OPTIONS = ['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '강원특별자치도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'];
const INDUSTRY_OPTIONS = ['정보통신업', '도매 및 소매업', '제조업', '전문, 과학 및 기술 서비스업', '건설업', '숙박 및 음식점업', '교육 서비스업', '부동산업', '금융 및 보험업', '예술, 스포츠 및 여가관련 서비스업', '보건업 및 사회복지 서비스업', '기타'];

export const ProfileEditPage = ({ onClose, onSave }: ProfileEditPageProps) => {
    const { refreshProfile, user, profile } = useAuth();
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [newInterest, setNewInterest] = useState('');
    const [location, setLocation] = useState('');
    const [industry, setIndustry] = useState('');
    const [userType, setUserType] = useState('');
    const [businessYears, setBusinessYears] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Economy');
    const [careers, setCareers] = useState<CareerEntry[]>([]);
    const [qualifications, setQualifications] = useState<QualificationEntry[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            if (profile) {
                setLocation(profile.location || '');
                setIndustry(profile.industry || '');
                setUserType(profile.user_type || '');
                setBusinessYears(profile.business_years || '');
            }
            const stored = await AsyncStorage.getItem('user_profile');
            if (stored) {
                const data = JSON.parse(stored);
                setNickname(data.nickname || '');
                setRealName(data.realName || '');
                setBio(data.bio || '');
                setImageUrl(profile?.avatar_url || data.imageUrl || '');
                setInterests(data.interests || []);
                const fullJob = data.job || '';
                if (fullJob.includes(' (')) {
                    const cat = fullJob.split(' (')[0];
                    if (JOB_CATEGORIES[cat]) setSelectedCategory(cat);
                } else if (JOB_CATEGORIES[fullJob]) {
                    setSelectedCategory(fullJob);
                }
                setCareers(data.careers || []);
                setQualifications(data.qualifications || []);
            }
        } catch (e) { console.error("Failed to load profile", e); }
    };

    const uploadImageToSupabase = async (file: File): Promise<string | null> => {
        if (!user) return null;
        try {
            setIsUploadingImage(true);
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `avatars/${user.id}/profile.${ext}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type });
            if (uploadError) return URL.createObjectURL(file);
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            return `${data.publicUrl}?t=${Date.now()}`;
        } catch (err) { return null; } finally { setIsUploadingImage(false); }
    };

    const handlePickImage = async () => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = async (e: any) => {
                const file = e.target?.files?.[0];
                if (!file) return;
                setImageUrl(URL.createObjectURL(file));
                const publicUrl = await uploadImageToSupabase(file);
                if (publicUrl) setImageUrl(publicUrl);
            };
            input.click();
        } else {
            const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
            if (!result.canceled && result.assets?.[0]) setImageUrl(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        try {
            const profileData = { nickname, realName, bio, imageUrl, interests, job: selectedCategory, careers, qualifications };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
            if (user) {
                const updates: any = { id: user.id, updated_at: new Date().toISOString(), location: location || null, industry: industry || null };
                if (imageUrl && !imageUrl.startsWith('blob:')) updates.avatar_url = imageUrl;
                if (businessYears) updates.business_years = businessYears;
                await supabase.from('profiles').upsert(updates);
                await supabase.auth.updateUser({ data: { user_role: selectedCategory } });
            }
            await refreshProfile?.();
            onSave(); onClose();
        } catch (e) { console.error("Failed to save", e); }
    };

    const addCareer = () => setCareers([...careers, { id: Date.now().toString(), company: '', role: '', period: '', description: '' }]);
    const addQualification = (type: 'certification' | 'activity' | 'award') => setQualifications([...qualifications, { id: Date.now().toString(), type, title: '', issuer: '', date: '' }]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.leftCol}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>프로필 설정</Text>
                        <Text style={styles.subtitle}>나를 표현하는 정보를 입력하세요</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Image */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>프로필 이미지</Text>
                        <View style={styles.avatarCard}>
                            <View style={styles.avatarCircle}>
                                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatarImg} /> : <Camera size={32} color="#94A3B8" />}
                            </View>
                            <View style={styles.avatarActions}>
                                <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage} style={styles.actionBtn}>
                                    {isUploadingImage ? <ActivityIndicator size="small" color="#FFF" /> : <Plus size={18} color="#FFF" />}
                                    <Text style={styles.actionBtnText}>{isUploadingImage ? '업로드 중...' : '이미지 업로드'}</Text>
                                </TouchableOpacity>
                                {imageUrl && <TouchableOpacity onPress={() => setImageUrl('')} style={styles.resetBtn}><RotateCcw size={18} color="#64748B" /></TouchableOpacity>}
                            </View>
                        </View>
                    </View>

                    {/* Basic Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>기본 정보</Text>
                        <View style={styles.lightCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>닉네임</Text>
                                <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="활동명을 입력하세요" placeholderTextColor="#94A3B8" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>실명</Text>
                                <TextInput style={styles.input} value={realName} onChangeText={setRealName} placeholder="실명을 입력하세요" placeholderTextColor="#94A3B8" />
                            </View>
                        </View>
                    </View>

                    {/* Matching Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>🎯 AI 매칭 정보</Text>
                        <View style={[styles.lightCard, styles.accentBorder]}>
                            <Text style={styles.chipGroupLabel}>활동 지역</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                {LOCATION_OPTIONS.map(loc => (
                                    <TouchableOpacity key={loc} onPress={() => setLocation(loc)} style={[styles.chip, location === loc && styles.chipActive]}>
                                        <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>{loc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.chipGroupLabel, { marginTop: 16 }]}>산업 분야</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                {INDUSTRY_OPTIONS.map(ind => (
                                    <TouchableOpacity key={ind} onPress={() => setIndustry(ind)} style={[styles.chip, industry === ind && styles.chipActiveEmerald]}>
                                        <Text style={[styles.chipText, industry === ind && styles.chipTextActive]}>{ind}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.saveBtnText}>저장하기</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* RIGHT COLUMN */}
            <View style={styles.rightCol}>
                <Text style={styles.rightTitle}>상세 이력</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>자신을 소개하는 글</Text>
                        <TextInput style={styles.textArea} multiline numberOfLines={4} value={bio} onChangeText={setBio} placeholder="소개글을 작성하세요..." placeholderTextColor="#94A3B8" />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>경력 입력</Text>
                            <TouchableOpacity onPress={addCareer} style={styles.addBtn}><Plus size={16} color="#FFF" /><Text style={styles.addBtnText}>추가</Text></TouchableOpacity>
                        </View>
                        {careers.map((career) => (
                            <View key={career.id} style={styles.careerCard}>
                                <TextInput style={styles.inputBase} placeholder="회사명" value={career.company} onChangeText={(v)=>setCareers(careers.map(c=>c.id===career.id ? {...c, company:v}:c))} />
                                <TextInput style={styles.inputBase} placeholder="기간 (예: 2020 - 2023)" value={career.period} onChangeText={(v)=>setCareers(careers.map(c=>c.id===career.id ? {...c, period:v}:c))} />
                                <TouchableOpacity onPress={()=>setCareers(careers.filter(c=>c.id!==career.id))} style={styles.removeBtn}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3', flexDirection: 'row' },
    leftCol: { width: 450, borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 24, backgroundColor: '#FFFFFF' },
    rightCol: { flex: 1, padding: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { color: '#18181b', fontSize: 26, fontWeight: '800' },
    subtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingBottom: 60 },
    section: { marginBottom: 32 },
    sectionLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    avatarCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    avatarCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: '#FFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    avatarImg: { width: '100%', height: '100%' },
    avatarActions: { flexDirection: 'row', gap: 10, width: '100%' },
    actionBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 8 },
    resetBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    lightCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 16 },
    accentBorder: { borderColor: '#7C3AED44' },
    inputGroup: { gap: 6 },
    inputLabel: { color: '#18181b', fontWeight: '600', fontSize: 14 },
    input: { height: 46, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, color: '#18181b', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14 },
    chipGroupLabel: { color: '#475569', fontSize: 13, fontWeight: '600' },
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    chipActiveEmerald: { backgroundColor: '#10B981', borderColor: '#10B981' },
    chipText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    chipTextActive: { color: '#FFF' },
    saveBtn: { backgroundColor: '#7C3AED', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    rightTitle: { color: '#18181b', fontSize: 24, fontWeight: '800', marginBottom: 24 },
    textArea: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, fontSize: 15, color: '#18181b', borderWidth: 1, borderColor: '#E2E8F0', minHeight: 140, textAlignVertical: 'top' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 },
    careerCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
    inputBase: { height: 40, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 10, fontSize: 14, color: '#18181b' },
    removeBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 8 }
});
