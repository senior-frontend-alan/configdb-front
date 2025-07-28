<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import FloatLabel from 'primevue/floatlabel';
  import InputText from 'primevue/inputtext';
  import Password from 'primevue/password';
  import Button from 'primevue/button';
  import Card from 'primevue/card';

  const router = useRouter();
  const authStore = useAuthStore();
  const username = ref('');
  const password = ref('');
  const isLocalAuthAllowed = true;

  const appConfig = computed(() => window.APP_CONFIG.appConfig || {});

  const clearError = () => {
    authStore.resetError();
  };

  const login = async () => {
    if (!username.value || !password.value) {
      return;
    }

    try {
      // Используем метод login из стора authStore
      const success = await authStore.login({
        username: username.value,
        password: password.value,
      });

      if (success) {
        // После успешной аутентификации перенаправляем на главную страницу
        router.push('/');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
    }
  };

  /**
   * Выход из системы
   */
  const logout = async () => {
    try {
      await authStore.logout();
      // После выхода страница будет перезагружена автоматически
      // так как метод logout в authStore сам делает перенаправление
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };
</script>

<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <img src="../assets/favicon.jpg" alt="Logo" style="border-radius: 8px" /> &nbsp;
        <span class="logo-text">{{ appConfig.siteTitle }}</span>
      </div>
    </div>

    <div class="login-container">
      <Card class="login-card">
        <template #content>
          <form @submit.prevent="login" class="login-form" data-testid="login-form">
            <InputGroup class="field">
              <InputGroupAddon>
                <i class="pi pi-user"></i>
              </InputGroupAddon>
              <FloatLabel variant="in">
                <InputText
                  id="in_label"
                  data-testid="login-username-input"
                  v-model="username"
                  type="email"
                  required
                  :disabled="!isLocalAuthAllowed || authStore.loading"
                  :invalid="!!(authStore.error && authStore.error.message)"
                  @input="clearError"
                />
                <label for="in_label">User Name (email)*</label>
              </FloatLabel>
            </InputGroup>

            <InputGroup class="field">
              <InputGroupAddon>
                <i class="pi pi-lock"></i>
              </InputGroupAddon>
              <FloatLabel variant="in">
                <Password
                  id="password_label"
                  v-model="password"
                  required
                  :feedback="false"
                  toggleMask
                  :disabled="!isLocalAuthAllowed || authStore.loading"
                  :invalid="!!(authStore.error && authStore.error.message)"
                  inputClass="w-full"
                  @input="clearError"
                  :inputProps="{ 'data-testid': 'login-password-input' } as any"
                />
                <label for="password_label">Password*</label>
              </FloatLabel>
            </InputGroup>

            <div class="login-actions">
              <Button
                v-if="!authStore.isAuthenticated"
                type="submit"
                label="Войти"
                class="p-button-primary w-full"
                data-testid="login-submit-btn"
                :loading="authStore.loading"
                :disabled="!isLocalAuthAllowed || authStore.loading"
              />

              <Button
                v-if="authStore.isAuthenticated"
                type="button"
                label="Разлогиниться (активная сессия)"
                class="p-button-danger w-full"
                data-testid="login-logout-btn"
                :loading="authStore.loading"
                @click="logout"
              />
            </div>
          </form>
          <div v-if="authStore.error?.type" class="error-message" data-testid="login-error-message">
            <div>
              <i class="pi pi-exclamation-triangle" style="margin-right: 0.5rem"></i>
              <span v-if="authStore.error?.type">{{ authStore.error?.type }}</span
              >:
              <span v-if="authStore.error?.status">{{ authStore.error?.status }}</span>
            </div>
            <div v-if="authStore.error?.message">
              {{ authStore.error?.message }}
            </div>
          </div>
        </template>
      </Card>
    </div>
    <div class="login-footer">
      <p>&copy; Nexign, JSC, 1992–2025, version: 3.2.0, build time: 2025-03-12 11:30:11</p>
    </div>
  </div>
</template>

<style scoped>
  .login-page {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 100vh;
    background-image: url('../assets/loginPageBackground.jpg');
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .login-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  .login-container {
    width: 100%;
    max-width: 600px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    height: 100vh;
    position: relative;
  }

  .login-header {
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    z-index: 3;
    width: auto;
    background-color: rgba(3, 105, 161, 0.3);
    padding: 10px 15px;
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  .logo {
    display: flex;
    align-items: center;
    color: white;
  }

  .logo-icon {
    border-radius: 8px;
  }

  .logo-letter {
    background-color: #0ba52a;
    color: white;
    font-size: 1.8rem;
    font-weight: bold;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    margin-right: 0.5rem;
  }

  .logo-text {
    font-size: 1.2rem;
    font-weight: 500;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .login-card {
    position: relative;
    width: 100%;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .login-form {
    padding: 1rem;
  }

  .field {
    margin-bottom: 1rem;
  }

  .login-actions {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    margin-top: 1.5rem;
  }

  .error-message {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    color: #f44336;
    transform: translateY(100%);
    font-size: 0.875rem;
    background-color: #1d0a0933;
    border-left: 3px solid #f44336;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .login-footer {
    position: fixed;
    bottom: 0px;
    left: 0;
    right: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    text-align: center;
    width: 100%;
    z-index: 2;
    background-color: rgba(3, 105, 161, 0.3);
    padding: 2px 0;
    backdrop-filter: blur(5px);
  }

  /* Чтобы глазик в поле Password был виден */
  .p-password-toggle-mask-icon {
    z-index: 1;
  }
</style>
