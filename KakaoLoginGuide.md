# 카카오 소셜 로그인 연동 가이드 (Expo + Supabase)

현재 Publica 앱은 Supabase Auth를 사용하고 있으므로, 카카오 로그인을 연동하려면 **카카오 개발자 콘솔**과 **Supabase 콘솔** 양쪽에서의 설정이 필요합니다.

---

## 1. 카카오 개발자 콘솔 설정 (Kakao Developers)

1. **내 애플리케이션 추가**: [Kakao Developers](https://developers.kakao.com/) 로그인 후 새 애플리케이션을 만듭니다.
2. **카카오 로그인 설정**:
    - [내 애플리케이션] > [제품 설정] > [카카오 로그인] 에서 **활성화**를 'ON'으로 바꿉니다.
    - **OpenID Connect** 활성화를 권장합니다 (Supabase 이메일 연동에 유리).
3. **Redirect URI 등록**:
    - [카카오 로그인] 메뉴 하단의 'Redirect URI'에 다음을 추가합니다:
      `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
      *(프로젝트 ID는 Supabase 대시보드 URL에서 확인할 수 있습니다)*
4. **동의항목 설정**:
    - [카카오 로그인] > [동의항목]에서 아래 항목을 설정합니다:
        - **닉네임**: 필수 동의
        - **카카오계정(이메일)**: 선택 또는 필수 동의 (사업자 등록 시 필수 가능)
        - **프로필 사진**: 선택 동의
5. **보안 (Client Secret)**:
    - [카카오 로그인] > [보안] 에서 **Client Secret**을 생성하고 활성화합니다.

---

## 2. Supabase 콘솔 설정

1. [Supabase Dashboard] > [Authentication] > [Providers]로 이동합니다.
2. **Kakao** 항목을 찾아 활성화합니다.
3. 다음 정보를 입력합니다:
    - **Client ID**: 카카오 개발자 콘솔의 **[앱 키] > [REST API 키]**
    - **Client Secret**: 위 1-5에서 생성한 **Client Secret** 값
4. **Save**를 눌러 저장합니다.

---

## 3. 코드 적용 및 검증

현재 프로젝트의 `src/contexts/AuthContext.tsx`에는 이미 카카오 로그인 로직이 구현되어 있습니다:

```typescript
const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
            redirectTo: Platform.select({
                web: window.location.origin,
                default: 'publica://auth/callback'
            })
        }
    });
};
```

### 주의 사항 (Deep Linking)
- 앱으로 돌아오기 위해 `app.json`에 `scheme: "publica"`가 설정된 상태여야 합니다. (현재 이미 설정되어 있습니다)
- 리액트 네이티브(Expo) 환경에서는 인증 후 앱으로 돌아오는 브라우저 콜백 처리를 위해 `expo-linking` 또는 `expo-auth-session`이 잘 작동하는지 확인해야 합니다.

---

## 4. 테스트 방법
1. 앱 내 로그인 화면에서 '카카오 로그인' 버튼을 클릭합니다.
2. 카카오 로그인 웹 페이지가 뜨면 로그인 및 동의를 진행합니다.
3. 자동으로 `publica://auth/callback`을 통해 앱으로 복귀하며 로그인이 완료되는지 확인합니다.
