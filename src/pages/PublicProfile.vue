<script>
import { mapGetters, mapState } from 'vuex'
import * as mutationTypes from 'src/store/mutation-types'
import { map } from 'lodash'

import AssetCard from 'src/components/AssetCard'
import OwnerAssetCard from 'src/components/OwnerAssetCard'
import ProfileCard from 'src/components/ProfileCard'
import AppAvatar from 'src/components/AppAvatar'
import AppFooter from 'src/components/AppFooter'

import PageComponentMixin from 'src/mixins/pageComponent'

import {
  matVerified,
  matGridView,
  matCloudDownload,
  matEmojiEvents,
  matMessage,
  matAdd,
} from '@quasar/extras/material-icons'
import {
  mdiTwitter,
  mdiGithub,
  mdiLinkedin,
} from '@quasar/extras/mdi-v5'

export default {
  name: 'PublicProfile',
  components: {
    AssetCard,
    OwnerAssetCard,
    ProfileCard,
    AppAvatar,
    AppFooter,
  },
  mixins: [
    PageComponentMixin,
  ],
  data () {
    return {
      isDarkMode: true,
      activeTab: 'projects',
      activityData: [12, 18, 45, 30, 25, 60, 40],
      activityLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    }
  },
  computed: {
    ...mapGetters([
      'selectedUser',
      'currentUser',
      'usersAssets',
    ]),
    ...mapState([
      'content',
      'common',
      'style',
    ]),
    isCurrentUser () {
      return this.currentUser.id === this.selectedUser.id
    },
    selectedUserAssets () {
      return this.usersAssets[this.selectedUser.id] || []
    },
    displayName () {
      return this.selectedUser.displayName || `${this.selectedUser.firstName} ${this.selectedUser.lastName}`
    },
    userHandle () {
      // Fallback handle logic
      return `@${(this.selectedUser.username || this.selectedUser.displayName || 'user').toLowerCase().replace(/\s+/g, '_')}`
    },
    joinedDate () {
      if (!this.selectedUser.createdDate) return 'Joined Recently'
      const date = new Date(this.selectedUser.createdDate)
      return `Joined ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
    },
    userInitials () {
      const first = this.selectedUser.firstName ? this.selectedUser.firstName[0] : ''
      const last = this.selectedUser.lastName ? this.selectedUser.lastName[0] : ''
      return (first + last).toUpperCase() || (this.selectedUser.displayName ? this.selectedUser.displayName[0].toUpperCase() : 'U')
    },
    reputationScore () {
      // Mock reputation or derived from ratings
      return 856 
    },
    totalDownloads () {
      return '1.2k'
    }
  },
  async preFetch ({ store, currentRoute, redirect }) {
    const { id: userId } = currentRoute.params
    try {
      const user = await store.dispatch('fetchUser', { userId })
      store.commit({
        type: mutationTypes.SET_SELECTED_USER,
        user
      })
      await store.dispatch('fetchAssetTypes')
    } catch (err) {
      const code = err.statusCode
      if (code >= 400 && code < 500) redirect(`/${code}`)
      else throw err
    }
  },
  watch: {
    async '$route' () {
      this.loadProfile()
    }
  },
  async created () {
    this.icons = {
      matVerified,
      matGridView,
      matCloudDownload,
      matEmojiEvents,
      matMessage,
      matAdd,
      mdiTwitter,
      mdiGithub,
      mdiLinkedin,
    }
    this.loadProfile()
  },
  methods: {
    loadProfile () {
      return Promise.all([
        this.fetchUserAssets(),
      ])
    },
    async fetchUserAssets () {
      return this.$store.dispatch('fetchUserAssets', {
        userId: this.selectedUser.id
      })
    },
    getMaxActivity () {
      return Math.max(...this.activityData)
    }
  }
}
</script>

<template>
  <QPage :class="['profile-page transition-all', isDarkMode ? 'bg-black text-white' : 'bg-white text-black']">
    
    <!-- Banner Section -->
    <div class="profile-banner relative-position">
      <div class="banner-gradient absolute-full"></div>
      
      <!-- Overlapping Avatar -->
      <div class="avatar-container absolute">
        <div class="avatar-ring" :class="isDarkMode ? 'bg-black' : 'bg-white'">
          <div class="avatar-content bg-accent text-black flex flex-center text-weight-bold text-h5 font-mono">
            {{ userInitials }}
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content q-px-lg">
      <!-- User Info Header -->
      <div class="row justify-between items-end q-pt-xl q-pb-lg">
        <div class="col-12 col-sm-8">
          <div class="row items-center q-gutter-x-sm q-mb-xs">
            <h1 class="text-h4 text-weight-bold q-my-none font-mono tracking-tighter">{{ displayName }}</h1>
            <QIcon :name="icons.matVerified" size="24px" color="primary" />
          </div>
          <div class="user-meta text-grey font-mono text-caption">
            {{ userHandle }} • {{ joinedDate }}
          </div>
        </div>
        
        <div class="col-12 col-sm-4 row justify-end q-gutter-x-md q-mt-md sm-mt-none">
          <QBtn 
            label="Follow" 
            color="primary" 
            text-color="black" 
            unelevated 
            no-caps 
            class="button-round text-weight-bold q-px-lg" 
          />
          <QBtn 
            label="Message" 
            outline 
            :color="isDarkMode ? 'white' : 'black'" 
            no-caps 
            class="button-round text-weight-bold q-px-lg" 
          />
        </div>
      </div>

      <!-- Bio / Description -->
      <div class="bio-section q-mb-xl max-w-lg">
        <p class="text-body1 line-height-15" :class="isDarkMode ? 'text-grey-4' : 'text-grey-8'">
          {{ selectedUser.description || 'Designing open-source automation tools and custom PCB shields for the Arduino ecosystem. Focused on high-speed data logging and MIDI controllers.' }}
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div class="col-12 col-sm-4">
          <div class="stat-card q-pa-lg round-md transition-all" :class="isDarkMode ? 'bg-surface border-light' : 'bg-grey-2'">
            <div class="text-caption text-grey font-mono q-mb-xs">PROJECTS</div>
            <div class="text-h4 text-weight-bold font-mono">{{ selectedUserAssets.length }}</div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="stat-card q-pa-lg round-md transition-all" :class="isDarkMode ? 'bg-surface border-light' : 'bg-grey-2'">
            <div class="text-caption text-grey font-mono q-mb-xs">DOWNLOADS</div>
            <div class="text-h4 text-weight-bold font-mono">{{ totalDownloads }}</div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="stat-card q-pa-lg round-md transition-all" :class="isDarkMode ? 'bg-surface border-light' : 'bg-grey-2'">
            <div class="text-caption text-grey font-mono q-mb-xs">REPUTATION</div>
            <div class="text-h4 text-weight-bold font-mono">{{ reputationScore }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container border-bottom q-mb-xl">
        <div class="row q-gutter-x-xl">
          <div 
            v-for="tab in ['PROJECTS', 'COLLECTIONS', 'ABOUT']" 
            :key="tab"
            class="tab-item q-pb-md cursor-pointer transition-all relative-position text-weight-bold font-mono"
            :class="[
              activeTab === tab.toLowerCase() ? 'text-primary' : (isDarkMode ? 'text-grey-6' : 'text-grey-7'),
              activeTab === tab.toLowerCase() ? 'active-tab' : ''
            ]"
            @click="activeTab = tab.toLowerCase()"
          >
            {{ tab }}
          </div>
        </div>
      </div>

      <!-- Activity Overview (Only for Projects tab) -->
      <div v-if="activeTab === 'projects'" class="q-mb-xl">
        <div class="activity-overview q-pa-xl round-md" :class="isDarkMode ? 'bg-surface border-light' : 'bg-grey-1'">
          <div class="text-caption text-grey font-mono q-mb-lg uppercase tracking-widest">Activity Overview</div>
          <div class="chart-container row items-end justify-between q-gutter-x-sm">
            <div v-for="(val, index) in activityData" :key="index" class="col column items-center">
              <div 
                class="chart-bar bg-white transition-all round-xs" 
                :style="{ height: (val * 1.5) + 'px', width: '100%', maxWidth: '24px' }"
              ></div>
              <div class="text-caption text-grey font-mono q-mt-md">{{ activityLabels[index] }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div v-if="activeTab === 'projects'">
        <div class="row justify-between items-center q-mb-lg">
          <h2 class="text-h5 text-weight-bold q-my-none">Latest Uploads</h2>
        </div>
        
        <div class="row q-col-gutter-lg">
          <div v-for="asset in selectedUserAssets" :key="asset.id" class="col-12 col-sm-6 col-md-4">
            <AssetCard 
              :asset="asset" 
              class="profile-asset-card" 
              :class="isDarkMode ? 'dark-card' : 'light-card'"
            />
          </div>
          
          <div v-if="selectedUserAssets.length === 0" class="col-12 text-center q-pa-xl">
            <QIcon :name="icons.matGridView" size="64px" color="grey-7" class="q-mb-md" />
            <div class="text-h6 text-grey-7">No projects uploaded yet</div>
          </div>
        </div>
      </div>

      <!-- Separator for bottom padding -->
      <div class="q-py-xl"></div>
    </div>
    
    <AppFooter />
  </QPage>
</template>

<style lang="stylus" scoped>
.profile-page
  min-height: 100vh

.profile-banner
  height: 160px
  overflow: visible

.banner-gradient
  background: linear-gradient(90deg, #1A1A1A 0%, #333333 100%)

.avatar-container
  bottom: -40px
  left: 32px
  z-index: 10

.avatar-ring
  padding: 4px
  border-radius: 50%
  width: 88px
  height: 88px

.avatar-content
  width: 80px
  height: 80px
  border-radius: 50%
  background: #22D3EE
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.3)

.profile-content
  max-width: 1200px
  margin: 0 auto
  padding-top: 40px

.button-round
  border-radius: 8px

.bg-accent
  background: #22D3EE

.text-accent
  color: #22D3EE

.border-light
  border: 1px solid rgba(255, 255, 255, 0.1)

.bg-surface
  background: #111111

.round-md
  border-radius: 12px

.round-xs
  border-radius: 2px

.max-w-lg
  max-width: 800px

.line-height-15
  line-height: 1.6

.border-bottom
  border-bottom: 1px solid rgba(150, 150, 150, 0.2)

.tab-item
  letter-spacing: 1px
  font-size: 13px
  &:hover
    color: #22D3EE !important

.active-tab::after
  content: ''
  position: absolute
  bottom: -1px
  left: 0
  width: 100%
  height: 2px
  background: $primary

.chart-bar
  min-height: 4px
  &:hover
    background: #22D3EE !important
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.5)

.profile-asset-card
  height: 100%
  display: flex
  flex-direction: column

.uppercase
  text-transform: uppercase

.tracking-widest
  letter-spacing: 2px

.transition-all
  transition: all 0.3s ease

/* Custom responsive spacing */
@media (max-width: $breakpoint-xs-max)
  .sm-mt-none
    margin-top: 24px
  .avatar-container
    left: 50%
    transform: translateX(-50%)
  .profile-content
    text-align: center
  .justify-between
    justify-content: center !important
  .items-end
    align-items: center !important
  .max-w-lg
    margin: 0 auto
</style>
