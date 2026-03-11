
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator } from 'react-native';
import { X, Check, Building2, Beaker, ShieldCheck, ChevronRight, Briefcase, Crown, ArrowRight, Plus, Trash2, Award, Activity, Camera, RotateCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfileEditPageProps {
    onClose: () => void;
    onSave: () => void;
}

// Data Structures
interface CareerEntry {
    id: string;
    company: string;
    role: string;
    period: string;
    description: string;
}

interface QualificationEntry {
    id: string;
    type: 'certification' | 'activity' | 'award';
    title: string;
    issuer: string;
    date: string;
}

import { JOB_CATEGORIES } from '../utils/profileConstants';

const LOCATION_OPTIONS = ['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '강원특별자치도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'];
const INDUSTRY_OPTIONS = ['정보통신업', '도매 및 소매업', '제조업', '전문, 과학 및 기술 서비스업', '건설업', '숙박 및 음식점업', '교육 서비스업', '부동산업', '금융 및 보험업', '예술, 스포츠 및 여가관련 서비스업', '보건업 및 사회복지 서비스업', '기타'];

export const ProfileEditPage = ({ onClose, onSave }: ProfileEditPageProps) => {
    const { refreshProfile, user, profile } = useAuth();
    // 1. Profile State
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [newInterest, setNewInterest] = useState('');

    // Matching-critical fields (synced from profiles table)
    const [location, setLocation] = useState('');
    const [industry, setIndustry] = useState('');
    const [userType, setUserType] = useState('');
    const [businessYears, setBusinessYears] = useState('');

    // Job Hierarchy State
    const [selectedCategory, setSelectedCategory] = useState<string>('Economy');
    const [selectedSubfield, setSelectedSubfield] = useState<string>('');
    const [customJob, setCustomJob] = useState('');

    // 2. Career & Qualifications
    const [careers, setCareers] = useState<CareerEntry[]>([]);
    const [qualifications, setQualifications] = useState<QualificationEntry[]>([]);

    // 3. Load Data
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            // Load matching-critical fields from AuthContext profile (Supabase source of truth)
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
                // Supabase avatar_url takes priority over cached blob URL in AsyncStorage
                const supabaseAvatar = profile?.avatar_url;
                setImageUrl(supabaseAvatar || data.imageUrl || '');
                setInterests(data.interests || []);

                // Parse Job
                const fullJob = data.job || '';
                if (fullJob.includes('(') && fullJob.includes(')')) {
                    const [cat, sub] = fullJob.split(' (');
                    const cleanSub = sub.replace(')', '');
                    if (JOB_CATEGORIES[cat]) {
                        setSelectedCategory(cat);
                        setSelectedSubfield(cleanSub);
                        setCustomJob('');
                    } else {
                        setCustomJob(fullJob);
                    }
                } else if (JOB_CATEGORIES[fullJob]) {
                    setSelectedCategory(fullJob);
                    setSelectedSubfield('');
                    setCustomJob('');
                } else {
                    setCustomJob(fullJob);
                }

                setCareers(data.careers || []);
                setQualifications(data.qualifications || []);
            }
        } catch (e) {
            console.error("Failed to load profile", e);
        }
    };

    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const uploadImageToSupabase = async (file: File): Promise<string | null> => {
        if (!user) return null;
        try {
            setIsUploadingImage(true);
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `avatars/${user.id}/profile.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (uploadError) {
                // Bucket may not exist — try creating it or use fallback blob URL
                console.warn('Supabase Storage upload failed:', uploadError.message);
                // Fallback: store as blob URL (works until page refresh)
                return URL.createObjectURL(file);
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            // Add cache-busting param so browser always loads fresh image
            return `${data.publicUrl}?t=${Date.now()}`;
        } catch (err) {
            console.error('Image upload error:', err);
            return null;
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handlePickImage = async () => {
        try {
            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                    const file = e.target?.files?.[0];
                    if (!file) return;
                    // Show local preview immediately
                    const previewUrl = URL.createObjectURL(file);
                    setImageUrl(previewUrl);
                    // Upload to Supabase Storage in background
                    const publicUrl = await uploadImageToSupabase(file);
                    if (publicUrl) setImageUrl(publicUrl);
                };
                input.click();
            } else {
                const result = await DocumentPicker.getDocumentAsync({
                    type: 'image/*',
                    copyToCacheDirectory: true,
                });
                if (!result.canceled && result.assets && result.assets.length > 0) {
                    setImageUrl(result.assets[0].uri);
                }
            }
        } catch (err) {
            console.error('Error picking image:', err);
        }
    };


    // 4. Save Logic
    const handleSave = async () => {
        try {
            const finalJob = customJob || selectedCategory;

            const profileData = {
                nickname, realName, bio, imageUrl, interests,
                job: finalJob,
                careers,
                qualifications
            };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

            // Sync matching-critical fields to Supabase
            if (user) {
                const updates: any = {
                    id: user.id,
                    updated_at: new Date().toISOString(),
                    location: location || null,
                    industry: industry || (customJob || selectedCategory) || null,
                };

                // Save avatar_url if it's a real URL (not a blob)
                if (imageUrl && !imageUrl.startsWith('blob:')) {
                    updates.avatar_url = imageUrl;
                }

                if (businessYears) updates.business_years = businessYears;

                console.log('ProfileEditPage saving to Supabase:', updates);

                const { error } = await supabase
                    .from('profiles')
                    .upsert(updates);

                if (error) {
                    console.warn('ProfileEditPage save partial fail:', error.message);
                    // Retry with minimal fields
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        updated_at: new Date().toISOString(),
                        location: location || null,
                        industry: industry || null,
                    });
                }

                // Sync to Auth Metadata for Header display
                await supabase.auth.updateUser({
                    data: { user_role: finalJob }
                });
            }

            // Reload profile in AuthContext
            await refreshProfile?.();

            onSave();
            onClose();
        } catch (e) {
            console.error("Failed to save", e);
        }
    };

    // 5. Career Management
    const addCareer = () => {
        setCareers([...careers, {
            id: Date.now().toString(),
            company: '',
            role: '',
            period: '',
            description: ''
        }]);
    };

    const updateCareer = (id: string, field: keyof CareerEntry, value: string) => {
        setCareers(careers.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const deleteCareer = (id: string) => {
        setCareers(careers.filter(c => c.id !== id));
    };

    // 6. Qualification Management
    const addQualification = (type: 'certification' | 'activity' | 'award') => {
        setQualifications([...qualifications, {
            id: Date.now().toString(),
            type,
            title: '',
            issuer: '',
            date: ''
        }]);
    };

    const updateQualification = (id: string, field: keyof QualificationEntry, value: string) => {
        setQualifications(qualifications.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const deleteQualification = (id: string) => {
        setQualifications(qualifications.filter(q => q.id !== id));
    };

    // 7. Interest Management
    const addInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest('');
        }
    };

    const removeInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest));
    };

    const displayJob = customJob || selectedCategory;

    return (
        <View className="flex-1 bg-[#050B14] flex-row">
            {/* LEFT COLUMN: Basic Info */}
            <View className="w-[450px] p-8 border-r border-white/5">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-white text-3xl font-bold mb-2">프로필 설정</Text>
                        <Text className="text-slate-400">나를 표현하는 정보를 입력하세요</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">프로필 이미지</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5 items-center">
                            <View className="w-32 h-32 rounded-full bg-slate-800 mb-6 overflow-hidden border-2 border-white/10 shadow-lg shadow-black/50">
                                {imageUrl ? (
                                    <Image source={{ uri: imageUrl }} className="w-full h-full" />
                                ) : (
                                    <View className="w-full h-full items-center justify-center">
                                        <Camera size={40} color="#334155" />
                                    </View>
                                )}
                            </View>

                            <View className="flex-row gap-3 w-full">
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    disabled={isUploadingImage}
                                    className="flex-1 flex-row items-center justify-center bg-blue-600 h-12 rounded-xl border border-blue-400/30"
                                    style={{ opacity: isUploadingImage ? 0.6 : 1 }}
                                >
                                    {isUploadingImage ? (
                                        <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                                    ) : (
                                        <Plus size={18} color="white" style={{ marginRight: 8 }} />
                                    )}
                                    <Text className="text-white font-bold">{isUploadingImage ? '업로드 중...' : '이미지 업로드'}</Text>
                                </TouchableOpacity>

                                {imageUrl && (
                                    <TouchableOpacity
                                        onPress={() => setImageUrl('')}
                                        className="w-12 h-12 items-center justify-center bg-slate-800 rounded-xl border border-white/10"
                                    >
                                        <RotateCcw size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text className="mt-4 text-slate-500 text-[11px] text-center">
                                JPG, PNG, GIF 파일을 지원하며, 최대 5MB까지 권장합니다.
                            </Text>
                        </View>
                    </View>

                    {/* Identity */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">기본 정보</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5 gap-4">
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">익명 닉네임</Text>
                                <TextInput
                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                    placeholder="익명으로 활동할 때 사용됩니다"
                                    placeholderTextColor="#475569"
                                    value={nickname}
                                    onChangeText={setNickname}
                                />
                            </View>
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">이름 (공개 프로필)</Text>
                                <TextInput
                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                    placeholder="실명을 입력하세요"
                                    placeholderTextColor="#475569"
                                    value={realName}
                                    onChangeText={setRealName}
                                />
                            </View>
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">이메일 주소</Text>
                                <View className="bg-slate-900/50 border border-white/5 rounded-xl p-3">
                                    <Text className="text-slate-400">{user?.email}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Matching-Critical Fields */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">🎯 AI 매칭 필수 정보</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-blue-500/20 gap-4">
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">활동 지역 <Text className="text-red-400">*</Text></Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                    {LOCATION_OPTIONS.map(loc => (
                                        <TouchableOpacity
                                            key={loc}
                                            onPress={() => setLocation(loc)}
                                            className={`px-3 py-2 rounded-full border ${location === loc ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-white/10'}`}
                                        >
                                            <Text className={`text-xs font-medium ${location === loc ? 'text-white' : 'text-slate-400'}`}>{loc}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">산업 / 업종 <Text className="text-red-400">*</Text></Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                    {INDUSTRY_OPTIONS.map(ind => (
                                        <TouchableOpacity
                                            key={ind}
                                            onPress={() => setIndustry(ind)}
                                            className={`px-3 py-2 rounded-full border ${industry === ind ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-white/10'}`}
                                        >
                                            <Text className={`text-xs font-medium ${industry === ind ? 'text-white' : 'text-slate-400'}`}>{ind}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            {(userType === 'business') && (
                                <View>
                                    <Text className="text-slate-300 text-sm mb-2 font-medium">사업 업력</Text>
                                    <View className="flex-row gap-2">
                                        {['<3yr', '3-7yr', '>7yr'].map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                onPress={() => setBusinessYears(y)}
                                                className={`px-4 py-2 rounded-full border ${businessYears === y ? 'bg-amber-600 border-amber-500' : 'bg-slate-800 border-white/10'}`}
                                            >
                                                <Text className={`text-sm font-medium ${businessYears === y ? 'text-white' : 'text-slate-400'}`}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                            <View className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                                <Text className="text-blue-400 text-xs">💡 이 정보는 맞춤 공고 AI 매칭에 직접 사용됩니다. 정확하게 입력할수록 더 관련성 높은 공고를 추천받을 수 있어요.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Profession */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">산업 / 전공 분야</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                {Object.keys(JOB_CATEGORIES).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => { setSelectedCategory(cat); setSelectedSubfield(''); setCustomJob(''); }}
                                        className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-white/10'}`}
                                    >
                                        <Text className={`text-sm font-medium ${selectedCategory === cat ? 'text-white' : 'text-slate-400'}`}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Interests */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">관심 분야</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                            <View className="flex-row gap-2 mb-4">
                                <TextInput
                                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                    placeholder="관심사 추가 (예: AI, FinTech)"
                                    placeholderTextColor="#475569"
                                    value={newInterest}
                                    onChangeText={setNewInterest}
                                    onSubmitEditing={addInterest}
                                />
                                <TouchableOpacity onPress={addInterest} className="bg-blue-600 px-4 rounded-xl items-center justify-center">
                                    <Plus size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {interests.map(interest => (
                                    <View key={interest} className="bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/20 flex-row items-center gap-2">
                                        <Text className="text-blue-400 text-sm font-bold">{interest}</Text>
                                        <TouchableOpacity onPress={() => removeInterest(interest)}>
                                            <X size={14} color="#60A5FA" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity onPress={handleSave} className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/30">
                        <Text className="text-white font-bold text-lg">저장하기</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* RIGHT COLUMN: Detailed Sections */}
            <View className="flex-1 p-8 bg-[#020617]">
                <Text className="text-white text-3xl font-bold mb-8">상세 이력</Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Bio Section */}
                    <View className="mb-8">
                        <Text className="text-slate-400 text-lg font-bold mb-4">간단한 소개 입력</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                            <TextInput
                                className="bg-slate-900 border border-white/10 rounded-xl p-4 text-white min-h-[120px]"
                                placeholder="자신을 소개하는 글을 작성하세요..."
                                placeholderTextColor="#475569"
                                multiline
                                textAlignVertical="top"
                                value={bio}
                                onChangeText={setBio}
                            />
                        </View>
                    </View>

                    {/* Career Section */}
                    <View className="mb-8">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-400 text-lg font-bold">경력입력</Text>
                            <TouchableOpacity onPress={addCareer} className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center gap-2">
                                <Plus size={16} color="white" />
                                <Text className="text-white font-bold text-sm">경력 추가</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="gap-4">
                            {careers.map(career => (
                                <View key={career.id} className="bg-[#0F172A] p-6 rounded-3xl border border-white/5 relative">
                                    <TouchableOpacity
                                        onPress={() => deleteCareer(career.id)}
                                        className="absolute top-4 right-4 w-8 h-8 bg-red-500/10 rounded-full items-center justify-center border border-red-500/20"
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-slate-400 text-xs mb-1">회사명</Text>
                                            <TextInput
                                                className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white pr-12"
                                                placeholder="회사 이름"
                                                placeholderTextColor="#475569"
                                                value={career.company}
                                                onChangeText={(v) => updateCareer(career.id, 'company', v)}
                                            />
                                        </View>
                                        <View className="flex-row gap-3">
                                            <View className="flex-1">
                                                <Text className="text-slate-400 text-xs mb-1">직책</Text>
                                                <TextInput
                                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                                    placeholder="직책/역할"
                                                    placeholderTextColor="#475569"
                                                    value={career.role}
                                                    onChangeText={(v) => updateCareer(career.id, 'role', v)}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-slate-400 text-xs mb-1">기간</Text>
                                                <TextInput
                                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                                    placeholder="2020.01 - 2023.12"
                                                    placeholderTextColor="#475569"
                                                    value={career.period}
                                                    onChangeText={(v) => updateCareer(career.id, 'period', v)}
                                                />
                                            </View>
                                        </View>
                                        <View>
                                            <Text className="text-slate-400 text-xs mb-1">업무 설명</Text>
                                            <TextInput
                                                className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white min-h-[80px]"
                                                placeholder="담당 업무 및 성과를 입력하세요"
                                                placeholderTextColor="#475569"
                                                multiline
                                                textAlignVertical="top"
                                                value={career.description}
                                                onChangeText={(v) => updateCareer(career.id, 'description', v)}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                            {careers.length === 0 && (
                                <View className="bg-[#0F172A]/50 p-6 rounded-3xl border border-dashed border-white/10 items-center">
                                    <Briefcase size={32} color="#475569" />
                                    <Text className="text-slate-500 mt-2">경력 정보를 추가해보세요</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Qualifications Section */}
                    <View className="mb-8">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-400 text-lg font-bold">자격 / 대외활동 / 수상경력</Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity onPress={() => addQualification('certification')} className="bg-emerald-600 px-3 py-2 rounded-xl">
                                    <Text className="text-white font-bold text-xs">자격증</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addQualification('activity')} className="bg-purple-600 px-3 py-2 rounded-xl">
                                    <Text className="text-white font-bold text-xs">대외활동</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addQualification('award')} className="bg-amber-600 px-3 py-2 rounded-xl">
                                    <Text className="text-white font-bold text-xs">수상</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className="gap-4">
                            {qualifications.map(qual => {
                                const colorClass = qual.type === 'certification' ? 'emerald' : qual.type === 'activity' ? 'purple' : 'amber';
                                return (
                                    <View key={qual.id} className="bg-[#0F172A] p-6 rounded-3xl border border-white/5 relative">
                                        <View className={`absolute top-4 left-4 px-2 py-1 rounded-lg bg-${colorClass}-500/10 border border-${colorClass}-500/20`}>
                                            <Text className={`text-${colorClass}-400 text-xs font-bold uppercase`}>
                                                {qual.type === 'certification' ? '자격증' : qual.type === 'activity' ? '대외활동' : '수상'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => deleteQualification(qual.id)}
                                            className="absolute top-4 right-4 w-8 h-8 bg-red-500/10 rounded-full items-center justify-center border border-red-500/20"
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                        <View className="gap-3 mt-6">
                                            <View>
                                                <Text className="text-slate-400 text-xs mb-1">이름/제목</Text>
                                                <TextInput
                                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white pr-12"
                                                    placeholder="자격증/활동/수상 이름"
                                                    placeholderTextColor="#475569"
                                                    value={qual.title}
                                                    onChangeText={(v) => updateQualification(qual.id, 'title', v)}
                                                />
                                            </View>
                                            <View className="flex-row gap-3">
                                                <View className="flex-1">
                                                    <Text className="text-slate-400 text-xs mb-1">발급/주최기관</Text>
                                                    <TextInput
                                                        className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                                        placeholder="기관명"
                                                        placeholderTextColor="#475569"
                                                        value={qual.issuer}
                                                        onChangeText={(v) => updateQualification(qual.id, 'issuer', v)}
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-slate-400 text-xs mb-1">취득/수상일</Text>
                                                    <TextInput
                                                        className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                                        placeholder="2023.06"
                                                        placeholderTextColor="#475569"
                                                        value={qual.date}
                                                        onChangeText={(v) => updateQualification(qual.id, 'date', v)}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {qualifications.length === 0 && (
                                <View className="bg-[#0F172A]/50 p-6 rounded-3xl border border-dashed border-white/10 items-center">
                                    <Award size={32} color="#475569" />
                                    <Text className="text-slate-500 mt-2">자격증, 대외활동, 수상경력을 추가해보세요</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};
