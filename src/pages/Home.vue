<script>
import { mapState, mapGetters } from 'vuex'
import {
  matSearch,
  matAdd,
  matArrowForward,
  matGridView,
  matPrecisionManufacturing,
  matRouter,
  matHomeMax,
  matWatch,
  matSensors,
  matCloudUpload,
  matVisibility,
  matFavoriteBorder,
  matFileDownload,
  matWbSunny,
  matNightsStay,
} from '@quasar/extras/material-icons'
import {
  mdiTwitter,
  mdiGithub,
  mdiYoutube,
  mdiDiscord,
  mdiForum,
} from '@quasar/extras/mdi-v5'

import PageComponentMixin from 'src/mixins/pageComponent'
import AuthDialogMixin from 'src/mixins/authDialog'
import AssetCard from 'src/components/AssetCard'
import AppAvatar from 'src/components/AppAvatar'

export default {
  name: 'Home',
  components: {
    AssetCard,
    AppAvatar,
  },
  mixins: [
    PageComponentMixin,
    AuthDialogMixin,
  ],
  data () {
    return {
      searchQuery: '',
      selectedCategory: 'All Projects',
      isDarkMode: true,
      categories: [
        { label: 'All Projects', icon: matGridView },
        { label: 'Robotics', icon: matPrecisionManufacturing },
        { label: 'IoT', icon: matRouter },
        { label: 'Home Automation', icon: matHomeMax },
        { label: 'Wearables', icon: matWatch },
        { label: 'Sensors', icon: matSensors },
      ],
      trendingAssets: [],
    }
  },
  computed: {
    ...mapState({
      style: state => state.style,
      content: state => state.content,
    }),
    ...mapGetters([
      'currentUser',
    ]),
    accountName () {
      return this.currentUser.firstName
        ? `${this.currentUser.firstName} ${this.currentUser.lastName || ''}` : this.currentUser.displayName
    },
  },
  async created () {
    this.icons = {
      matSearch,
      matAdd,
      matArrowForward,
      matCloudUpload,
      matVisibility,
      matFavoriteBorder,
      matFileDownload,
      matWbSunny,
      matNightsStay,
      mdiTwitter,
      mdiGithub,
      mdiYoutube,
      mdiDiscord,
      mdiForum,
    }

    this.refreshTrendingAssets()
  },
  watch: {
    selectedCategory () {
      this.refreshTrendingAssets()
    }
  },
  methods: {
    search () {
      if (this.searchQuery) {
        this.$store.commit('SET_SEARCH_QUERY', { query: this.searchQuery })
      }
      this.$router.push({ name: 'search' })
    },
    goToUpload () {
      this.$router.push({ name: 'uploadProject' })
    },
    logout () {
      this.$store.dispatch('logout')
      // No need to redirect if already on home
    },
    getAuthorInitials (asset) {
      if (!asset.owner) return '?'
      const first = asset.owner.firstName ? asset.owner.firstName[0] : ''
      const last = asset.owner.lastName ? asset.owner.lastName[0] : ''
      return (first + last).toUpperCase() || asset.owner.displayName[0].toUpperCase()
    },
    getAuthorName (asset) {
      return asset.owner ? (asset.owner.displayName || `${asset.owner.firstName} ${asset.owner.lastName}`) : 'Unknown'
    },
    async refreshTrendingAssets () {
      const filters = { nbResults: 6 }
      
      if (this.selectedCategory !== 'All Projects') {
        filters.customAttributesFilters = {
          category: this.selectedCategory
        }
      }

      const assets = await this.$store.dispatch('fetchLastAssets', filters)
      this.trendingAssets = assets || []
    }
  }
}
</script>

<template>
  <QPage :class="['home-page transition-all', isDarkMode ? 'bg-black text-white' : 'bg-white text-black']">
    
    <!-- ═══════════════════ CUSTOM HEADER ═══════════════════ -->
    <header class="landing-header absolute-top row justify-between items-center q-px-lg q-py-md z-max">
      <div class="row items-center cursor-pointer" @click="$router.push({ name: 'home' })">
        <div class="text-h5 text-weight-900 font-mono tracking-tighter">NARUBLOCKS</div>
      </div>

      <nav class="row items-center gap-lg gt-xs">
        <a href="#" class="nav-link text-primary text-weight-bold">Explore</a>
        <a href="#" class="nav-link text-weight-bold" :class="isDarkMode ? 'text-grey-5' : 'text-grey-7'">Challenges</a>
        
        <!-- Theme Toggle -->
        <QBtn
          flat
          round
          dense
          :icon="isDarkMode ? icons.matWbSunny : icons.matNightsStay"
          :color="isDarkMode ? 'white' : 'black'"
          @click="isDarkMode = !isDarkMode"
        >
          <q-tooltip>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</q-tooltip>
        </QBtn>

        <!-- Auth Buttons -->
        <div v-if="!currentUser.id" class="row items-center">
          <QBtn
            flat
            no-caps
            label="Log In"
            :color="isDarkMode ? 'white' : 'black'"
            class="text-weight-bold q-mr-sm"
            @click="openAuthDialog({ redirectAfterSignup: true })"
          />
          <QBtn
            unelevated
            color="primary"
            text-color="black"
            label="Upload Project"
            no-caps
            class="text-weight-bold q-px-lg"
            @click="goToUpload"
          />
        </div>

        <div v-else class="row items-center">
          <QBtn
            unelevated
            color="primary"
            text-color="black"
            label="Upload Project"
            no-caps
            class="text-weight-bold q-px-lg q-mr-md"
            @click="goToUpload"
          />
          
          <QBtn flat round>
            <AppAvatar :user="currentUser" size="32px" />
            <QMenu :content-class="isDarkMode ? 'bg-surface text-white' : 'bg-white text-black'">
              <div class="q-pa-md" style="min-width: 200px">
                <div class="text-weight-bold q-mb-xs">{{ accountName }}</div>
                <div class="text-caption text-grey-7 q-mb-md">{{ currentUser.email }}</div>
                
                <QList dense>
                  <QItem clickable v-close-popup :to="{ name: 'publicProfile', params: { id: currentUser.id }}">
                    <QItemSection>Profile</QItemSection>
                  </QItem>
                  <QItem clickable v-close-popup :to="{ name: 'inbox' }">
                    <QItemSection>Inbox</QItemSection>
                  </QItem>
                  <QSeparator class="q-my-sm" :dark="isDarkMode" />
                  <QItem clickable v-close-popup @click="logout">
                    <QItemSection class="text-negative">Logout</QItemSection>
                  </QItem>
                </QList>
              </div>
            </QMenu>
          </QBtn>
        </div>
      </nav>

      <!-- Mobile Menu Button (Visible only on XS) -->
      <div class="row items-center lt-sm">
        <QBtn
          flat
          round
          dense
          :icon="isDarkMode ? icons.matWbSunny : icons.matNightsStay"
          :color="isDarkMode ? 'white' : 'black'"
          class="q-mr-sm"
          @click="isDarkMode = !isDarkMode"
        />
        
        <!-- Mobile Profile/Login Icon -->
        <QBtn
          v-if="currentUser.id"
          flat
          round
          dense
          class="q-mr-sm"
        >
          <AppAvatar :user="currentUser" size="24px" />
          <QMenu :content-class="isDarkMode ? 'bg-surface text-white' : 'bg-white text-black'">
             <QList dense style="min-width: 150px">
                <QItem clickable v-close-popup :to="{ name: 'publicProfile', params: { id: currentUser.id }}">
                  <QItemSection>Profile</QItemSection>
                </QItem>
                <QItem clickable v-close-popup @click="logout">
                  <QItemSection class="text-negative">Logout</QItemSection>
                </QItem>
             </QList>
          </QMenu>
        </QBtn>
        <QBtn
          v-else
          flat
          round
          dense
          icon="login"
          :color="isDarkMode ? 'white' : 'black'"
          class="q-mr-sm"
          @click="openAuthDialog({ redirectAfterSignup: true })"
        />

        <QBtn icon="menu" flat :color="isDarkMode ? 'white' : 'black'" @click="$store.commit('LAYOUT__TOGGLE_MENU')" />
      </div>
    </header>

    <!-- ═══════════════════ HERO SECTION ═══════════════════ -->
    <section class="hero-section relative-position flex flex-center column">
      <div class="hero-bg absolute-full">
        <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" class="hero-img fit object-cover" />
        <div class="hero-overlay absolute-full" :class="isDarkMode ? 'bg-black-grad' : 'bg-white-grad'"></div>
      </div>
      
      <div class="hero-content relative-position text-center q-px-md animate-fade-up">
        <div class="text-primary text-weight-bolder text-uppercase q-mb-sm tracking-widest">Build The Future</div>
        <h1 class="text-h2 md:text-h1 text-weight-900 q-mb-md leading-tight">
          Share Your Circuits<br>with the World
        </h1>
        <p class="text-h6 q-mb-xl max-w-md mx-auto" :class="isDarkMode ? 'text-grey-5' : 'text-grey-8'">
          The premier community for Arduino, ESP32, and Robotics enthusiasts.
        </p>

        <!-- Search Bar -->
        <div class="search-container row items-center q-pa-xs q-pl-md round-md shadow-lg mx-auto" :class="isDarkMode ? 'bg-white text-black' : 'bg-grey-2 text-black'">
          <QIcon :name="icons.matSearch" size="24px" color="grey-5" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search schematics, code, or components..." 
            class="search-input col q-mx-md text-body1"
            :class="isDarkMode ? 'text-black' : 'text-black'"
            @keyup.enter="search"
          />
          <QBtn
            unelevated
            color="primary"
            text-color="black"
            label="Search"
            no-caps
            class="search-btn text-weight-bold q-px-lg"
            @click="search"
          />
        </div>
      </div>
    </section>

    <div class="content-container q-px-lg q-py-xl mx-auto">
      
      <!-- ═══════════════════ CATEGORIES ═══════════════════ -->
      <section class="categories-section q-mb-xl">
        <h2 class="text-h5 text-weight-900 q-mb-lg">Browse by Category</h2>
        <div class="categories-scroll no-scrollbar row no-wrap q-gutter-md">
          <div
            v-for="cat in categories"
            :key="cat.label"
            class="category-card cursor-pointer row items-center q-px-lg q-py-sm transition-all"
            :class="[
              selectedCategory === cat.label ? 'bg-primary text-black border-primary' : '',
              selectedCategory !== cat.label && isDarkMode ? 'bg-surface text-white border-grey' : '',
              selectedCategory !== cat.label && !isDarkMode ? 'bg-grey-2 text-black border-grey-4' : ''
            ]"
            @click="selectedCategory = cat.label"
          >
            <QIcon :name="cat.icon" size="20px" class="q-mr-sm" />
            <span class="text-weight-bold">{{ cat.label }}</span>
          </div>
        </div>
      </section>

      <!-- ═══════════════════ TRENDING SECTION ═══════════════════ -->
      <section class="trending-section q-mb-xl">
        <div class="row justify-between items-end q-mb-lg">
          <div>
            <h2 class="text-h4 text-weight-900 q-mb-xs">Trending Now</h2>
            <p class="q-mb-none" :class="isDarkMode ? 'text-grey-5' : 'text-grey-7'">Most downloaded projects this week</p>
          </div>
          <QBtn
            flat
            no-caps
            label="View All"
            icon-right="arrow_forward"
            color="primary"
            class="text-weight-bold"
            @click="search"
          />
        </div>

        <div class="row q-col-gutter-lg">
          <div
            v-for="asset in trendingAssets"
            :key="asset.id"
            class="col-12 col-sm-6 col-md-4"
          >
            <AssetCard :asset="asset" :class="['project-card', isDarkMode ? 'dark-card' : 'light-card']">
              <!-- Custom Content Slot for AssetCard -->
              <template #default="{ asset }">
                <div class="q-pt-sm">
                  <div class="text-h6 text-weight-bold ellipsis" :class="isDarkMode ? 'text-white' : 'text-black'">{{ asset.name }}</div>
                  
                  <div class="row items-center justify-between q-mt-xs q-mb-sm">
                    <div class="row items-center">
                      <QAvatar size="20px" :color="isDarkMode ? 'accent' : 'primary'" text-color="black" class="q-mr-sm text-caption text-weight-bold">
                        {{ getAuthorInitials(asset) }}
                      </QAvatar>
                      <span class="text-caption" :class="isDarkMode ? 'text-grey-5' : 'text-grey-7'">{{ getAuthorName(asset) }}</span>
                    </div>
                  </div>

                  <QSeparator :dark="isDarkMode" class="q-my-sm opacity-20" />

                  <div class="row justify-between items-center" :class="isDarkMode ? 'text-grey-5' : 'text-grey-7'">
                    <div class="row q-gutter-md">
                      <div class="row items-center gap-xs">
                        <QIcon :name="icons.matVisibility" size="16px" />
                        <span class="text-caption">1.2k</span> <!-- Mock Data -->
                      </div>
                      <div class="row items-center gap-xs">
                        <QIcon :name="icons.matFileDownload" size="16px" />
                        <span class="text-caption">450</span>  <!-- Mock Data -->
                      </div>
                    </div>
                    <QIcon :name="icons.matFavoriteBorder" size="18px" class="cursor-pointer hover-text-error" />
                  </div>
                </div>
              </template>
            </AssetCard>
          </div>
        </div>
      </section>

      <!-- ═══════════════════ CTA SECTION ═══════════════════ -->
      <section class="cta-section q-my-xl">
        <div class="cta-card border-primary q-pa-xl row items-center justify-between relative-position overflow-hidden" :class="isDarkMode ? 'bg-surface' : 'bg-grey-1'">
          <div class="col-12 col-md-8 relative-position z-10">
            <h2 class="text-h4 text-weight-900 q-mb-sm">Ready to share your creation?</h2>
            <p class="text-body1 q-mb-lg max-w-lg" :class="isDarkMode ? 'text-grey-5' : 'text-grey-8'">
              Join 50,000+ makers. Upload your project files, schematics, and code to help the community grow.
            </p>
            <QBtn
              unelevated
              color="primary"
              text-color="black"
              label="Get Started Now"
              size="lg"
              no-caps
              class="text-weight-bold"
              @click="goToUpload"
            />
          </div>
          <div class="col-12 col-md-4 flex flex-center gt-sm">
             <QIcon :name="icons.matCloudUpload" size="120px" color="primary" class="opacity-80" />
          </div>
        </div>
      </section>

      <QSeparator :dark="isDarkMode" class="q-my-xl opacity-20" />

      <!-- ═══════════════════ FOOTER ═══════════════════ -->
      <footer class="landing-footer q-pb-xl">
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-4">
            <div class="text-h6 text-weight-900 font-mono text-grey-5 q-mb-sm">NARUBLOCKS</div>
            <p class="text-caption" :class="isDarkMode ? 'text-grey-6' : 'text-grey-7'">The open hardware documentation platform.</p>
          </div>
          
          <div class="col-6 col-md-2">
            <div class="text-caption text-weight-bold q-mb-md" :class="isDarkMode ? 'text-white' : 'text-black'">COMMUNITY</div>
            <div class="column q-gutter-sm">
              <a href="#" class="nav-link-footer no-decoration" :class="isDarkMode ? 'text-grey-5 hover-text-white' : 'text-grey-7 hover-text-primary'">Forum</a>
              <a href="#" class="nav-link-footer no-decoration" :class="isDarkMode ? 'text-grey-5 hover-text-white' : 'text-grey-7 hover-text-primary'">Discord</a>
            </div>
          </div>
          
          <div class="col-6 col-md-2">
            <div class="text-caption text-weight-bold q-mb-md" :class="isDarkMode ? 'text-white' : 'text-black'">LEGAL</div>
            <div class="column q-gutter-sm">
              <a href="#" class="nav-link-footer no-decoration" :class="isDarkMode ? 'text-grey-5 hover-text-white' : 'text-grey-7 hover-text-primary'">Privacy</a>
              <a href="#" class="nav-link-footer no-decoration" :class="isDarkMode ? 'text-grey-5 hover-text-white' : 'text-grey-7 hover-text-primary'">Terms</a>
            </div>
          </div>
        </div>

        <QSeparator :dark="isDarkMode" class="q-my-lg opacity-20" />

        <div class="row justify-between items-center text-caption text-grey-7">
          <div>© 2026 NARUINO_LABS</div>
          <div class="row q-gutter-md">
            <QIcon :name="icons.mdiGithub" size="20px" class="cursor-pointer hover-text-primary" />
            <QIcon :name="icons.mdiTwitter" size="20px" class="cursor-pointer hover-text-primary" />
            <QIcon :name="icons.mdiYoutube" size="20px" class="cursor-pointer hover-text-primary" />
          </div>
        </div>
      </footer>
    </div>
  </QPage>
</template>

<style lang="stylus" scoped>
$primary-green = #4ADE80
$surface-black = #111111
$border-grey = #333333

// Utility
.transition-all
  transition all 0.3s ease-in-out
.text-primary
  color $primary-green !important
.bg-primary
  background $primary-green !important
.border-primary
  border 1px solid $primary-green
.bg-surface
  background $surface-black
.border-grey
  border 1px solid $border-grey
.font-mono
  font-family monospace
.text-weight-900
  font-weight 900
.opacity-20
  opacity 0.2
.opacity-80
  opacity 0.8
.z-max
  z-index 9999
.gap-lg
  gap 24px
.gap-xs
  gap 4px
.max-w-md
  max-width 450px
.max-w-lg
  max-width 600px
.mx-auto
  margin-left auto
  margin-right auto
.no-decoration
  text-decoration none
.hover-text-white:hover
  color white !important
.hover-text-primary:hover
  color $primary-green !important
.hover-text-error:hover
  color $negative

// Header
.landing-header
  background rgba(0,0,0,0.2)
  backdrop-filter blur(10px)

.nav-link
  text-decoration none
  font-size 14px
  transition color 0.3s
  &:hover
    color $primary-green

// Hero
.hero-section
  height 100vh
  min-height 600px
  width 100%

.hero-bg
  z-index 0
  
.bg-black-grad
  background linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,1) 100%)
.bg-white-grad
  background linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,1) 100%)

.hero-content
  z-index 1
  width 100%

.search-container
  max-width 500px
  border-radius 4px
  height 50px
  
.search-input
  border none
  outline none
  background transparent
  height 100%

// Categories
.category-card
  border-radius 4px
  white-space nowrap
  border-width 1px
  border-style solid

// Trending
.project-card
  ::v-deep .q-card
    border-radius 4px
.dark-card
  ::v-deep .q-card
    background $surface-black
    border 1px solid $border-grey
    color white
.light-card
  ::v-deep .q-card
    background #f8f9fa
    border 1px solid #e9ecef
    color black
  
// CTA
.cta-card
  border-radius 4px
  border 1px solid $primary-green

// Content Container
.content-container
  max-width 1200px
  width 100%
  position relative
  margin-top -100px // Overlap hero
  z-index 2

</style>

