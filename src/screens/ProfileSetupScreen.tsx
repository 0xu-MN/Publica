import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { Briefcase, Rocket, Beaker, User as UserIcon, Check, ChevronRight, Search, FileText, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JOB_CATEGORIES } from '../utils/profileConstants';

type UserType = 'business' | 'pre_entrepreneur' | 'researcher' | 'other';

const LOCATION_DATA: Record<string, string[]> = {
    '서울특별시': ['강남구', '서초구', '송파구', '마포구', '성동구', '종로구', '중구', '용산구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '강동구'],
    '경기도': ['수원시', '성남시', '용인시', '안양시', '안산시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '시흥시', '안성시', '양주시', '오산시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시', '가평군', '양평군', '여주시', '연천군'],
    '인천광역시': ['계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
    '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
    '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
    '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
    '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
    '세종특별자치시': ['세종시'],
    '강원도': ['강릉시', '동해시', '삼척시', '속초시', '원주시', '춘천시', '태백시', '고성군', '양구군', '양양군', '영월군', '인제군', '정선군', '철원군', '평창군', '홍천군', '화천군', '횡성군'],
    '충청북도': ['제천시', '청주시', '충주시', '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '증평군', '진천군'],
    '충청남도': ['계룡시', '공주시', '논산시', '당진시', '보령시', '서산시', '아산시', '천안시', '금산군', '부여군', '서천군', '예산군', '청양군', '태안군', '홍성군'],
    '전라북도': ['군산시', '김제시', '남원시', '익산시', '전주시', '정읍시', '고창군', '무주군', '부안군', '순창군', '완주군', '임실군', '장수군', '진안군'],
    '전라남도': ['광양시', '나주시', '목포시', '순천시', '여수시', '강진군', '고흥군', '곡성군', '구례군', '담양군', '무안군', '보성군', '신안군', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
    '경상북도': ['경산시', '경주시', '구미시', '김천시', '문경시', '상주시', '안동시', '영주시', '영천시', '포항시', '고령군', '군위군', '봉화군', '성주군', '영덕군', '영양군', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군'],
    '경상남도': ['거제시', '김해시', '밀양시', '사천시', '양산시', '진주시', '창원시', '통영시', '거창군', '고성군', '남해군', '산청군', '의령군', '창녕군', '하동군', '함안군', '함양군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시']
};

const RESEARCHER_TYPES = [
    '대학생',
    '대학원생',
    '박사후 연구원',
    '전문 연구원',
    '교수',
    '기타'
];

const MAJOR_CATEGORIES = Object.keys(JOB_CATEGORIES);
const INDUSTRY_CATEGORIES = Object.keys(JOB_CATEGORIES);

interface ProfileSetupProps {
    isEditing?: boolean;
    onClose?: () => void;
}

export const ProfileSetupScreen = ({ isEditing = false, onClose }: ProfileSetupProps) => {
    const { user, profile, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType | null>(null);

    // Form States
    const [sido, setSido] = useState('');
    const [sigungu, setSigungu] = useState('');
    const [industry, setIndustry] = useState('');
    const [businessYears, setBusinessYears] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [keywords, setKeywords] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [businessRegNo, setBusinessRegNo] = useState('');
    const [researcherId, setResearcherId] = useState('');
    const [researcherType, setResearcherType] = useState<string>('');
    const [studentId, setStudentId] = useState('');
    const [hasStartupIntent, setHasStartupIntent] = useState(false);
    const [majorCategory, setMajorCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [pickerModal, setPickerModal] = useState<{ visible: boolean, type: 'sido' | 'sigungu' | 'researcherType' | 'majorCategory' | 'industryCategory' }>({ visible: false, type: 'sido' });

    // Populate data if editing or existing profile
    useEffect(() => {
        if (profile) {
            if (profile.user_type) setUserType(profile.user_type as UserType);
            if (profile.sido) setSido(profile.sido);
            if (profile.sigungu) setSigungu(profile.sigungu);
            if (profile.industry) setIndustry(profile.industry);
            if (profile.business_years) setBusinessYears(profile.business_years);
            if (profile.birth_year) setBirthYear(profile.birth_year.toString());
            if (profile.research_keywords) setKeywords(profile.research_keywords.join(', '));
            if (profile.affiliation) setAffiliation(profile.affiliation);
            if (profile.business_reg_no) setBusinessRegNo(profile.business_reg_no);
            if (profile.researcher_id) setResearcherId(profile.researcher_id);
            if (profile.researcher_type) setResearcherType(profile.researcher_type);
            if (profile.student_id) setStudentId(profile.student_id);
            if (profile.has_startup_intent) setHasStartupIntent(profile.has_startup_intent);
            if (profile.major_category) setMajorCategory(profile.major_category);

            if (isEditing) setStep(2);
        }
    }, [profile, isEditing]);

    const isFormValid = () => {
        if (!userType) return false;
        if (userType === 'business') {
            return sido !== '' && sigungu !== '' && industry !== '' && businessYears !== '';
        }
        if (userType === 'pre_entrepreneur') {
            return sido !== '' && sigungu !== '' && industry !== '';
        }
        if (userType === 'researcher') {
            const isStudent = researcherType === '대학생' || researcherType === '대학원생';
            if (isStudent) {
                return keywords !== '' && affiliation !== '' && studentId !== '' && majorCategory !== '';
            }
            return researcherType !== '' && keywords !== '' && affiliation !== '' && majorCategory !== '';
        }
        if (userType === 'other') {
            return sido !== '' && sigungu !== '' && keywords !== '';
        }
        return false;
    };

    const handleSave = async () => {
        if (!user || !userType || !isFormValid()) return;
        setIsSaving(true);
        const fullLocation = sido && sigungu ? `${sido} ${sigungu}` : sido;

        try {
            const updates = {
                id: user.id,
                user_type: userType,
                industry,
                business_years: businessYears,
                birth_year: birthYear ? parseInt(birthYear) : null,
                research_keywords: keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k !== ''),
                affiliation,
                business_reg_no: businessRegNo,
                researcher_id: researcherId,
                researcher_type: researcherType,
                student_id: studentId,
                has_startup_intent: hasStartupIntent,
                major_category: majorCategory,
                sido,
                sigungu,
                updated_at: new Date().toISOString(),
            };

            // Also sync to AsyncStorage for workspace consistency
            const finalJob = majorCategory || industry;
            const profileData = {
                nickname: user.email?.split('@')[0],
                realName: profile?.full_name || '',
                bio: '',
                imageUrl: profile?.avatar_url || '',
                interests: keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k !== ''),
                job: finalJob,
                careers: [],
                qualifications: []
            };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Sync to Auth Metadata for Header display
            await supabase.auth.updateUser({
                data: { user_role: finalJob }
            });

            Alert.alert(isEditing ? '수정 완료' : '환영합니다!', isEditing ? '프로필이 업데이트되었습니다.' : '프로필 설정이 완료되었습니다.');
            await refreshProfile();
            if (onClose) onClose();
        } catch (e: any) {
            console.error('Save Profile Error:', e);
            Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderTypeCard = (type: UserType, title: string, desc: string, icon: any) => (
        <TouchableOpacity
            style={[styles.typeCard, userType === type && styles.typeCardActive]}
            onPress={() => setUserType(type)}
        >
            <View style={[styles.iconBox, userType === type && styles.iconBoxActive]}>
                {icon}
            </View>
            <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>{title}</Text>
                <Text style={styles.typeDesc}>{desc}</Text>
            </View>
            {userType === type && <Check size={20} color="#3B82F6" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {isEditing && (
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <X color="#94A3B8" size={24} />
                            </TouchableOpacity>
                        )}
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>{isEditing ? '프로필 수정' : '프로필 완성하기'}</Text>
                            <Text style={styles.subText}>{isEditing ? '변경할 정보를 확인해주세요.' : 'AI 맞춤 매칭을 위해 필수 정보를 확인해주세요.'}</Text>
                        </View>

                        {step === 1 ? (
                            <View style={styles.stepContainer}>
                                <Text style={styles.stepTitle}>회원 유형 선택</Text>
                                <View style={styles.cardGrid}>
                                    {renderTypeCard('business', '기존 사업자', '사업자 등록증 보유', <Briefcase size={22} color={userType === 'business' ? '#3B82F6' : '#64748B'} />)}
                                    {renderTypeCard('pre_entrepreneur', '예비 창업자', '창업 준비/아이디어', <Rocket size={22} color={userType === 'pre_entrepreneur' ? '#3B82F6' : '#64748B'} />)}
                                    {renderTypeCard('researcher', '연구원 / 학생', 'R&D 및 학술 연구', <Beaker size={22} color={userType === 'researcher' ? '#3B82F6' : '#64748B'} />)}
                                    {renderTypeCard('other', '프리랜서 / 기타', 'N잡러, 창작자 등', <UserIcon size={22} color={userType === 'other' ? '#3B82F6' : '#64748B'} />)}
                                </View>

                                <TouchableOpacity
                                    style={[styles.nextBtn, !userType && styles.btnDisabled]}
                                    disabled={!userType}
                                    onPress={() => setStep(2)}
                                >
                                    <Text style={styles.nextBtnText}>다음으로</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                    <Text style={styles.backBtnText}>이전으로</Text>
                                </TouchableOpacity>

                                {(userType === 'business' || userType === 'pre_entrepreneur' || userType === 'other') && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>활동 지역 <Text style={styles.required}>*</Text></Text>
                                        <View style={styles.row}>
                                            <TouchableOpacity
                                                style={[styles.dropdown, { flex: 1 }]}
                                                onPress={() => setPickerModal({ visible: true, type: 'sido' })}
                                            >
                                                <Text style={[styles.dropdownText, !sido && styles.placeholderText]}>{sido || '시/도'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.dropdown, { flex: 1 }]}
                                                onPress={() => {
                                                    if (!sido) {
                                                        Alert.alert('알림', '시/도를 먼저 선택해주세요.');
                                                        return;
                                                    }
                                                    setPickerModal({ visible: true, type: 'sigungu' })
                                                }}
                                            >
                                                <Text style={[styles.dropdownText, !sigungu && styles.placeholderText]}>{sigungu || '구/군'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {userType === 'business' && (
                                    <>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>사업 업력 <Text style={styles.required}>*</Text></Text>
                                            <View style={styles.row}>
                                                {['<3yr', '3-7yr', '>7yr'].map(y => (
                                                    <TouchableOpacity
                                                        key={y}
                                                        style={[styles.chip, businessYears === y && styles.chipActive]}
                                                        onPress={() => setBusinessYears(y)}
                                                    >
                                                        <Text style={[styles.chipText, businessYears === y && styles.chipTextActive]}>{y}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>주요 산업 분야 <Text style={styles.required}>*</Text></Text>
                                            <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setPickerModal({ visible: true, type: 'industryCategory' })}
                                            >
                                                <Text style={[styles.dropdownText, !industry && styles.placeholderText]}>
                                                    {industry || '분야 선택'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>사업자 정보 등록 (신뢰도 +5)</Text>
                                            <View style={styles.inputWrapper}>
                                                <Search size={18} color="#94A3B8" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.inputWithIcon}
                                                    placeholder="사업자등록번호 입력"
                                                    placeholderTextColor="#94A3B8"
                                                    value={businessRegNo}
                                                    onChangeText={setBusinessRegNo}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <TouchableOpacity style={styles.uploadBox}>
                                                <View style={styles.uploadIconBox}>
                                                    <FileText size={20} color="#3B82F6" />
                                                </View>
                                                <Text style={styles.uploadText}>사업자등록증 업로드 (빠른 인증)</Text>
                                                <ChevronRight size={16} color="#94A3B8" />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}

                                {userType === 'pre_entrepreneur' && (
                                    <>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>출생 연도</Text>
                                            <TextInput style={styles.input} placeholder="예: 1995" placeholderTextColor="#475569" keyboardType="numeric" value={birthYear} onChangeText={setBirthYear} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>창업 분야 <Text style={styles.required}>*</Text></Text>
                                            <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setPickerModal({ visible: true, type: 'industryCategory' })}
                                            >
                                                <Text style={[styles.dropdownText, !industry && styles.placeholderText]}>
                                                    {industry || '분야 선택'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}

                                {(userType === 'researcher' || userType === 'other') && (
                                    <>
                                        {userType === 'researcher' && (
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>연구원 구분 <Text style={styles.required}>*</Text></Text>
                                                <TouchableOpacity
                                                    style={styles.dropdown}
                                                    onPress={() => setPickerModal({ visible: true, type: 'researcherType' })}
                                                >
                                                    <Text style={[styles.dropdownText, !researcherType && styles.placeholderText]}>
                                                        {researcherType || '구분 선택'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>
                                                {(researcherType === '대학생' || researcherType === '대학원생') ? '학교명' : '소속 기관'} <Text style={styles.required}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder={(researcherType === '대학생' || researcherType === '대학원생') ? "대학교 이름을 입력해주세요" : "소속 기관을 입력해주세요"}
                                                placeholderTextColor="#475569"
                                                value={affiliation}
                                                onChangeText={setAffiliation}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>전공 / 연구 분야 <Text style={styles.required}>*</Text></Text>
                                            <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setPickerModal({ visible: true, type: 'majorCategory' })}
                                            >
                                                <Text style={[styles.dropdownText, !majorCategory && styles.placeholderText]}>
                                                    {majorCategory || '분야 선택'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {(researcherType === '대학생' || researcherType === '대학원생') && (
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>학번 <Text style={styles.required}>*</Text></Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="학번을 입력해주세요"
                                                    placeholderTextColor="#475569"
                                                    value={studentId}
                                                    onChangeText={setStudentId}
                                                />
                                            </View>
                                        )}

                                        {userType === 'researcher' && (
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>연구자 번호 (신뢰도 +5)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="NTIS 번호 등"
                                                    placeholderTextColor="#475569"
                                                    value={researcherId}
                                                    onChangeText={setResearcherId}
                                                />
                                            </View>
                                        )}

                                        {userType === 'researcher' && (
                                            <TouchableOpacity
                                                style={styles.checkboxContainer}
                                                onPress={() => setHasStartupIntent(!hasStartupIntent)}
                                            >
                                                <View style={[styles.checkbox, hasStartupIntent && styles.checkboxChecked]}>
                                                    {hasStartupIntent && <Check size={14} color="white" />}
                                                </View>
                                                <Text style={styles.checkboxLabel}>🚀 창업에 관심이 있습니다 (창업 관련 공고 매칭)</Text>
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>{userType === 'other' ? '관심 키워드 *' : '연구 키워드 *'}</Text>
                                            <TextInput style={styles.input} placeholder="쉼표로 구분" placeholderTextColor="#475569" value={keywords} onChangeText={setKeywords} />
                                        </View>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={[styles.saveBtn, (!isFormValid() || isSaving) && styles.btnDisabled]}
                                    disabled={!isFormValid() || isSaving}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.nextBtnText}>{isSaving ? '처리 중...' : isEditing ? '저장 완료' : '설정 완료'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Custom Picker Modal */}
            < Modal visible={pickerModal.visible} transparent animationType="slide" >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {pickerModal.type === 'sido' ? '시/도 선택' :
                                    pickerModal.type === 'sigungu' ? '구/군 선택' :
                                        pickerModal.type === 'researcherType' ? '구분 선택' :
                                            pickerModal.type === 'majorCategory' ? '전공 분야 선택' : '산업 분야 선택'}
                            </Text>
                            <TouchableOpacity onPress={() => setPickerModal({ ...pickerModal, visible: false })}>
                                <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {(pickerModal.type === 'sido' ? Object.keys(LOCATION_DATA) :
                                pickerModal.type === 'sigungu' ? (LOCATION_DATA[sido] || []) :
                                    pickerModal.type === 'researcherType' ? RESEARCHER_TYPES :
                                        pickerModal.type === 'majorCategory' ? MAJOR_CATEGORIES :
                                            INDUSTRY_CATEGORIES).map(item => (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={styles.modalItem}
                                                    onPress={() => {
                                                        if (pickerModal.type === 'sido') {
                                                            setSido(item);
                                                            setSigungu('');
                                                        } else if (pickerModal.type === 'sigungu') {
                                                            setSigungu(item);
                                                        } else if (pickerModal.type === 'researcherType') {
                                                            setResearcherType(item);
                                                        } else if (pickerModal.type === 'majorCategory') {
                                                            setMajorCategory(item);
                                                        } else if (pickerModal.type === 'industryCategory') {
                                                            setIndustry(item);
                                                        }
                                                        setPickerModal({ ...pickerModal, visible: false });
                                                    }}
                                                >
                                                    <Text style={styles.modalItemText}>{item}</Text>
                                                </TouchableOpacity>
                                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    overlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: 'white', width: '100%', maxWidth: 450, borderRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, elevation: 15, position: 'relative' },
    closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
    scrollContent: { paddingBottom: 20 },
    header: { marginBottom: 24, alignItems: 'center' },
    welcomeText: { color: '#0F172A', fontSize: 24, fontWeight: '800', marginBottom: 8 },
    subText: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    stepContainer: { flex: 1 },
    stepTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    cardGrid: { gap: 12, marginBottom: 24 },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    typeCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconBoxActive: { backgroundColor: 'white' },
    typeInfo: { flex: 1 },
    typeTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginBottom: 2 },
    typeDesc: { color: '#64748B', fontSize: 12 },
    nextBtn: { backgroundColor: '#3B82F6', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    btnDisabled: { opacity: 0.4 },
    backBtn: { marginBottom: 16 },
    backBtnText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    required: { color: '#EF4444' },
    input: {
        backgroundColor: '#F8FAFC',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        color: '#0F172A',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    row: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    chipActive: { backgroundColor: '#3B82F6' },
    chipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: 'white' },
    saveBtn: { backgroundColor: '#0F172A', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    dropdown: { backgroundColor: '#F8FAFC', height: 52, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    dropdownText: { color: '#0F172A', fontSize: 15 },
    placeholderText: { color: '#94A3B8' },
    inputWrapper: { position: 'relative', justifyContent: 'center' },
    inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
    inputWithIcon: {
        backgroundColor: '#F8FAFC',
        height: 52,
        borderRadius: 14,
        paddingLeft: 44,
        paddingRight: 16,
        color: '#0F172A',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    uploadBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        marginTop: 12
    },
    uploadIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    uploadText: { color: '#334155', fontSize: 13, fontWeight: '600', flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '70%' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
    modalBody: { padding: 8 },
    modalItem: { padding: 18, borderRadius: 12 },
    modalItemText: { color: '#0F172A', fontSize: 16, textAlign: 'center' },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6'
    },
    checkboxLabel: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: '600'
    }
});
