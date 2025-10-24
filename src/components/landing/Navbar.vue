<template>
  <header class="sticky top-0 z-50 backdrop-blur-sm font-serif bg-black/30 px-4 sm:px-6 lg:px-8 py-4">
    <nav class="flex items-center justify-between max-w-7xl mx-auto">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <img
          src="../../assets/images/apolo-name.png"
          alt="Apolo Fitness Center"
          class="h-12 sm:h-16 w-auto"
        />
      </div>
      <!-- Links desktop -->
      <div class="hidden md:flex items-center space-x-8 lg:space-x-12">
        <a
          @click.prevent="navigate('inicio')"
          class="text-white hover:text-apolo-primary font-normal cursor-pointer"
        >
          INICIO
        </a>
        <a
          @click.prevent="navigate('gimnasios')"
          class="text-white hover:text-apolo-primary font-medium cursor-pointer"
        >
          GIMNASIOS
        </a>
        <a
          @click.prevent="navigate('planes')"
          class="text-white hover:text-apolo-primary font-medium cursor-pointer"
        >
          PLANES
        </a>
        <router-link
          to="/login"
          class="bg-apolo-primary hover:bg-[#B8692F] text-black font-bold py-3 px-6 rounded-lg text-base"
        >
          ÁGORA
        </router-link>
      </div>
      <!-- Botón móvil -->
      <div class="md:hidden">
        <button @click="toggleMobileMenu" class="text-white hover:text-apolo-primary" aria-label="Menú">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </nav>

    <!-- Menú móvil -->
    <div v-if="mobileMenuOpen" class="md:hidden mt-2 bg-black/80 rounded-lg p-4">
      <a
        @click.prevent="navigate('inicio')"
        class="block text-white py-2 hover:text-apolo-primary font-medium text-base"
      >
        INICIO
      </a>
      <a
        @click.prevent="navigate('gimnasios')"
        class="block text-white py-2 hover:text-apolo-primary font-medium text-base"
      >
        GIMNASIOS
      </a>
      <a
        @click.prevent="navigate('planes')"
        class="block text-white py-2 hover:text-apolo-primary font-medium text-base"
      >
        PLANES
      </a>
      <router-link
        to="/login"
        @click.native="closeMobileMenu"
        class="block mt-2 bg-apolo-primary text-black font-bold py-3 px-6 rounded-lg text-center text-base"
      >
        ÁGORA
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const mobileMenuOpen = ref(false)
const router = useRouter()
const route = useRoute()

const getHeaderOffset = () => document.querySelector('header')?.offsetHeight || 0

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset() - 16
  window.scrollTo({ top, behavior: 'smooth' })
}

function navigate(section) {
  if (route.name === 'Home') {
    scrollToSection(section)
  } else {
    router.push({ name: 'Home', hash: `#${section}` })
  }
  closeMobileMenu()
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// cerrar menú al hacer click fuera
const handleClickOutside = (event) => {
  if (mobileMenuOpen.value && !event.target.closest('nav')) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
