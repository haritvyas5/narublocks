<script>
import { mapState, mapGetters } from 'vuex'
import { get, map, sortBy, values, compact, flatten, groupBy, isUndefined } from 'lodash'
import * as mutationTypes from 'src/store/mutation-types'

import { extractLocationDataFromPlace, isPlaceSearchEnabled } from 'src/utils/places'
import { populateAsset } from 'src/utils/asset'

import CustomAttributesEditor from 'src/components/CustomAttributesEditor'
import OwnerAssetCard from 'src/components/OwnerAssetCard'
import AssetCard from 'src/components/AssetCard'
import PlacesAutocomplete from 'src/components/PlacesAutocomplete'
import TransactionCard from 'src/components/TransactionCard'
import ProfileCard from 'src/components/ProfileCard'
import TransactionRatingsList from 'src/components/TransactionRatingsList'
import AppAvatar from 'src/components/AppAvatar'
import ProjectComments from 'src/components/ProjectComments'

import PageComponentMixin from 'src/mixins/pageComponent'
import PaymentMixin from 'src/mixins/payment'

import {
  matArrowBack,
  matShare,
  matFavoriteBorder,
  matFavorite,
  matLaunch,
  matGetApp,
  matAccountTree,
  matSchedule,
  matCode,
  matMemory,
  matSensors,
  matSettingsInputComponent,
  matDelete,
} from '@quasar/extras/material-icons'

export default {
  name: 'ProjectDetails',
  components: {
    CustomAttributesEditor,
    OwnerAssetCard,
    AssetCard,
    PlacesAutocomplete,
    TransactionCard,
    TransactionRatingsList,
    ProfileCard,
    AppAvatar,
    ProjectComments,
    VuePhotoSwipe: () => import(/* webpackChunkName: 'photoswipe' */ 'src/components/VuePhotoSwipe'),
  },
  mixins: [
    PageComponentMixin,
    PaymentMixin,
  ],
  data () {
    return {
      isDarkMode: true,
      activeTab: 'description',
      isPlaceSearchEnabled,
      ownerSimilarAssets: [],
      similarAssets: [],
      assetRatingsByTransaction: [],
      assetRatingsLoaded: false,
      isEditingImages: false,
      commentCount: 0,
      chartData: [20, 35, 45, 30, 25, 60, 85, 40, 30, 25, 20, 15],
      chartLabels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
    }
  },
  computed: {
    ...mapState([
      'asset',
      'common',
      'layout',
      'route',
      'transaction',
      'rating',
      'style',
    ]),
    ...mapGetters([
      'activeAsset',
      'usersAssets',
      'getResourceGalleryItems',
      'getResourceGalleryOptions',
      'currentUser',
      'searchOptions',
      'isActiveAssetAvailable',
      'ratingsOptions',
      'ratingsActive',
      'paymentActive',
    ]),
    isCurrentUserTheOwner () {
      return this.currentUser.id === this.activeAsset.ownerId
    },
    ownerDisplayName () {
      return get(this.activeAsset, 'owner.displayName')
    },
    ownerAssets () {
      return this.isCurrentUserTheOwner ? (this.usersAssets[this.currentUser.id] || []) : this.ownerSimilarAssets
    },
    galleryItems () {
      return this.getResourceGalleryItems(this.activeAsset)
    },
    projectTitle () {
      return this.activeAsset.name || 'Untitled Project'
    },
    makerHandle () {
      const owner = this.activeAsset.owner || {}
      return `@${(owner.username || owner.displayName || 'maker').toLowerCase().replace(/\s+/g, '_')}`
    },
    updatedDate () {
      if (!this.activeAsset.updatedDate) return 'Recently Updated'
      const now = new Date()
      const updated = new Date(this.activeAsset.updatedDate)
      const diffDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24))
      return diffDays === 0 ? 'Updated today' : `Updated ${diffDays}d ago`
    },
    bomItems () {
      // Mock BOM items based on common electronics or actual metadata if available
      return [
        { name: 'Arduino Nano Every', spec: 'ATMega4809 - 20MHz', qty: 'x1', icon: this.icons.matMemory },
        { name: 'DHT22 Sensor', spec: 'Humidity/Temp - Digital', qty: 'x2', icon: this.icons.matSensors },
        { name: '12V Peristaltic Pump', spec: 'PWM Controlled', qty: 'x3', icon: this.icons.matSettingsInputComponent },
      ]
    },
    tabs () {
      return [
        { label: 'DESCRIPTION', value: 'description' },
        { label: 'COMPONENTS', value: 'components' },
        { label: 'SCHEMATICS', value: 'schematics' },
        { label: `COMMENTS (${this.commentCount})`, value: 'comments' },
      ]
    },
    tags () {
      return get(this.activeAsset, 'metadata.tags', [])
    },
    narublockFileUrl () {
      return get(this.activeAsset, 'metadata.narublockFileUrl', '')
    },
    pxtEditorUrl () {
      // Assuming PXT runs on localhost:3232 when served
      // In a real scenario, this would point to the hosted PXT editor
      const pxtUrl = 'http://localhost:3232'
      if (this.narublockFileUrl) {
          return `${pxtUrl}/#importurl:${encodeURIComponent(this.narublockFileUrl)}`
      }
      return pxtUrl
    }
  },
  async preFetch ({ store, currentRoute, redirect }) {
    const { id: assetId } = currentRoute.params
    try {
      await store.dispatch('fetchActiveAsset', { assetId })
    } catch (err) {
      const code = err.statusCode
      if (code >= 400 && code < 500) redirect(`/${code}`)
      else throw err
    }
  },
  created () {
    this.icons = {
      matArrowBack,
      matShare,
      matFavoriteBorder,
      matFavorite,
      matLaunch,
      matGetApp,
      matAccountTree,
      matSchedule,
      matCode,
      matMemory,
      matSensors,
      matSettingsInputComponent,
      matDelete,
    }
    this.fetchRelatedAssets()
    this.fetchAssetRatingsByTransaction()
  },
  methods: {
    async fetchRelatedAssets () {
      await this.$store.dispatch('fetchAssetTypes')
      const assetTypeId = get(this.searchOptions, 'modes.default.assetTypesIds', [])
      const ownerId = get(this.activeAsset, 'ownerId')
      if (!ownerId) return

      if (this.isCurrentUserTheOwner) {
        await this.$store.dispatch('fetchUserAssets')
      } else {
        this.ownerSimilarAssets = await this.$store.dispatch('fetchAssets', {
          filters: { quantity: 1, assetTypeId, similarTo: this.activeAsset.id, filter: `_ownerId == ${ownerId}` },
          nbResults: 4
        })
      }
      this.similarAssets = await this.$store.dispatch('fetchAssets', {
        filters: { quantity: 1, assetTypeId, similarTo: this.activeAsset.id, filter: ` _ownerId != ${ownerId}${this.activeAsset.categoryId ? ` && _categoryId[${this.activeAsset.categoryId}]` : ''}` },
        nbResults: 4
      })
    },
    async fetchAssetRatingsByTransaction () {
      if (!this.ratingsActive) return
      this.assetRatingsByTransaction = await this.$store.dispatch('fetchRatingsByTransaction', { assetId: this.activeAsset.id })
      this.assetRatingsLoaded = true
    },
    updateAssetFn (fieldName) {
      return async (value) => {
        await this.$store.dispatch('updateActiveAsset', {
          assetId: this.activeAsset.id,
          attrs: { [fieldName]: value }
        })
        this.notifySuccess('notification.saved')
      }
    },
    goBack () {
      this.$router.go(-1)
    },
    async deleteProject () {
      if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

      try {
        await this.$store.dispatch('removeAsset', { assetId: this.activeAsset.id })
        this.notifySuccess('Project deleted successfully', { i18n: false })
        this.$router.push({ name: 'home' })
      } catch (err) {
        this.notifyWarning('error.unknown_happened_header')
      }
    },
    async forkProject () {
      if (!this.currentUser.id) {
        this.openAuthDialog({ action: 'fork' })
        return
      }

      if (this.isCurrentUserTheOwner) return

      if (!confirm('Fork this project to your account?')) return

      try {
        const newAsset = await this.$store.dispatch('forkAsset', { asset: this.activeAsset })
        this.notifySuccess('Project forked successfully!')
        this.$router.push({ name: 'asset', params: { id: newAsset.id } })
      } catch (err) {
        this.notifyWarning('error.unknown_happened_header')
      }
    },
    searchByTag (tag) {
      this.$router.push({ name: 'search', query: { q: tag } })
    }
  }
}
</script>

<template>
  <QPage :class="['project-details transition-all', isDarkMode ? 'bg-black text-white' : 'bg-white text-black']">
    
    <!-- Top Navigation Bar -->
    <header class="project-header row justify-between items-center q-px-lg q-py-md border-bottom">
      <div class="row items-center q-gutter-x-sm">
        <QBtn flat round dense :icon="icons.matArrowBack" @click="goBack" />
        <div class="breadcrumb text-caption font-mono uppercase text-grey tracking-widest gt-xs">
          PROJECTS / ARDUINO_CORE
        </div>
      </div>
      <div class="row items-center q-gutter-x-md">
        <QBtn 
          v-if="isCurrentUserTheOwner"
          flat 
          round 
          dense 
          :icon="icons.matDelete" 
          color="negative" 
          @click="deleteProject" 
        >
          <QTooltip>Delete Project</QTooltip>
        </QBtn>
        <QBtn flat round dense :icon="icons.matShare" color="grey" />
        <QBtn flat round dense :icon="icons.matFavoriteBorder" color="grey" />
      </div>
    </header>

    <div class="content-container q-px-lg q-py-xl">
      <!-- Hero Section -->
      <div class="row q-col-gutter-xl items-start q-mb-xl">
        <div class="col-12 col-md-4">
          <div class="project-image-wrapper relative-position round-md overflow-hidden border-light shadow-lg">
            <img 
              v-if="galleryItems.length" 
              :src="galleryItems[0].src" 
              class="project-image full-width block" 
              style="aspect-ratio: 1; object-fit: cover;"
            />
            <div v-else class="project-image-placeholder full-width bg-surface flex flex-center" style="aspect-ratio: 1;">
              <QIcon :name="icons.matCode" size="64px" :color="isDarkMode ? 'grey-8' : 'grey-4'" />
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-8">
          <div class="row items-center q-mb-sm">
            <div class="version-badge q-px-sm q-py-xs round-xs text-weight-bold font-mono tracking-tighter" style="background: rgba(74, 222, 128, 0.15); color: #4ADE80; font-size: 10px;">
              STABLE v1.2
            </div>
          </div>
          <h1 class="text-h2 text-weight-bold q-my-none font-mono tracking-tighter">{{ projectTitle }}</h1>
          
          <div class="row items-center q-gutter-x-md q-mt-md">
            <div class="row items-center q-gutter-x-sm">
              <AppAvatar :user="activeAsset.owner" size="24px" />
              <div class="text-weight-bold font-mono text-caption text-primary cursor-pointer">{{ makerHandle }}</div>
            </div>
            <div class="row items-center q-gutter-x-xs text-grey text-caption font-mono">
              <QIcon :name="icons.matSchedule" size="14px" />
              <span>{{ updatedDate }}</span>
            </div>
          </div>

          <div v-if="tags.length" class="row items-center q-gutter-xs q-mt-md">
            <QChip
              v-for="tag in tags"
              :key="tag"
              clickable
              outline
              color="primary"
              text-color="primary"
              size="sm"
              class="font-mono text-weight-bold"
              @click="searchByTag(tag)"
            >
              {{ tag }}
            </QChip>
          </div>

          <!-- Working File Action Card -->
          <div class="working-file-card q-mt-xl q-pa-lg round-md border-primary-glow" :class="isDarkMode ? 'bg-surface' : 'bg-grey-1'">
            <div class="row justify-between items-start q-mb-lg">
              <div>
                <div class="text-caption font-mono text-grey uppercase tracking-widest q-mb-xs">WORKING_FILE_ROOT</div>
                <div class="text-h6 text-weight-bold font-mono">hydro_controller_main.ino</div>
              </div>
              <QIcon :name="icons.matCode" size="28px" color="primary" />
            </div>
            
            <QBtn 
              unelevated 
              type="a"
              :href="pxtEditorUrl"
              target="_blank"
              color="white" 
              text-color="black" 
              no-caps 
              class="full-width text-weight-bold q-py-md q-mb-md button-rounded"
            >
              <template #default>
                <div class="row items-center q-gutter-x-sm">
                  <QIcon :name="icons.matLaunch" size="20px" />
                  <span>Open in Naruino Editor</span>
                </div>
              </template>
            </QBtn>

            <div class="row q-col-gutter-md">
              <div class="col">
                <QBtn outline :color="isDarkMode ? 'white' : 'black'" no-caps class="full-width text-weight-bold button-rounded q-py-sm">
                  <div class="row items-center q-gutter-x-sm">
                    <QIcon :name="icons.matGetApp" size="18px" />
                    <span>Download .ZIP</span>
                  </div>
                </QBtn>
              </div>
              <div class="col">
                <QBtn 
                  outline 
                  :color="isDarkMode ? 'white' : 'black'" 
                  no-caps 
                  class="full-width text-weight-bold button-rounded q-py-sm"
                  @click="forkProject"
                  :disable="isCurrentUserTheOwner"
                >
                  <div class="row items-center q-gutter-x-sm">
                    <QIcon :name="icons.matAccountTree" size="18px" />
                    <span>Fork Project</span>
                  </div>
                </QBtn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container border-bottom q-mb-xl">
        <div class="row q-gutter-x-xl">
          <div 
            v-for="tab in tabs" 
            :key="tab.value"
            class="tab-item q-pb-md cursor-pointer transition-all relative-position text-weight-bold font-mono"
            :class="[
              activeTab === tab.value ? 'text-primary' : (isDarkMode ? 'text-grey-6' : 'text-grey-7'),
              activeTab === tab.value ? 'active-tab' : ''
            ]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </div>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-7">
          <div v-if="activeTab === 'description'">
            <div class="bio-section q-mb-xl">
              <p class="text-body1 line-height-16 text-grey-4">
                {{ activeAsset.description || 'An automated nutrient dosing and light cycle controller for small-scale hydroponic systems. Built on the ATmega328P architecture with support for pH sensing and EC monitoring.' }}
              </p>
            </div>

            <!-- Activity / Performance Chart -->
            <div class="chart-section q-pa-xl round-md border-light q-mb-xl" :class="isDarkMode ? 'bg-surface' : 'bg-grey-1'">
              <div class="text-caption text-grey font-mono uppercase tracking-widest q-mb-lg">CPU LOAD SIMULATION (24H)</div>
              <div class="chart-container relative-position" style="height: 120px;">
                <!-- Simplified line chart Visualization -->
                <svg viewBox="0 0 400 100" class="full-width full-height">
                  <path 
                    d="M 0 80 Q 20 65 40 55 T 80 70 T 120 40 T 160 75 T 200 15 T 240 60 T 280 70 T 320 75 T 360 80 T 400 85" 
                    fill="none" 
                    stroke="#22D3EE" 
                    stroke-width="2" 
                    vector-effect="non-scaling-stroke"
                  />
                  <path 
                    d="M 0 80 Q 20 65 40 55 T 80 70 T 120 40 T 160 75 T 200 15 T 240 60 T 280 70 T 320 75 T 360 80 T 400 85 V 100 H 0 Z" 
                    fill="url(#gradient)" 
                    opacity="0.1" 
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#22D3EE;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#22D3EE;stop-opacity:0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="row justify-between q-mt-md text-caption font-mono text-grey-7">
                  <span v-for="label in ['00', '06', '12', '18', '24']" :key="label">{{ label }}</span>
                </div>
            </div>
          </div>
        </div>

          <!-- Comments Tab -->
          <div v-if="activeTab === 'comments'">
            <ProjectComments
              :asset="activeAsset"
              @update-count="val => commentCount = val"
            />
          </div>
        </div>

        <div class="col-12 col-md-5">
          <!-- Bill of Materials Section -->
          <div class="bom-section">
            <div class="row justify-between items-center q-mb-lg">
              <h3 class="text-h5 text-weight-bold q-my-none">Bill of Materials</h3>
              <div class="text-caption font-mono text-grey">3 items</div>
            </div>

            <div class="q-gutter-y-sm">
              <div 
                v-for="item in bomItems" 
                :key="item.name" 
                class="bom-item row items-center q-pa-md round-md border-light shadow-sm transition-all"
                :class="isDarkMode ? 'bg-surface' : 'bg-grey-1'"
              >
                <div class="icon-box q-pa-sm round-xs bg-black row items-center justify-center q-mr-md" style="width: 40px; height: 40px;">
                  <QIcon :name="item.icon" size="20px" color="grey-4" />
                </div>
                <div class="col">
                  <div class="text-weight-bold font-mono">{{ item.name }}</div>
                  <div class="text-caption text-grey font-mono">{{ item.spec }}</div>
                </div>
                <div class="text-weight-bold font-mono text-primary text-h6">{{ item.qty }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Section / Similar Assets -->
      <section v-if="similarAssets.length" class="q-mt-xl">
        <QSeparator class="q-my-xl" :dark="isDarkMode" />
        <h3 class="text-h4 text-weight-bold q-mb-xl">Similar Projects</h3>
        <div class="row q-col-gutter-lg justify-start">
          <div v-for="asset in similarAssets" :key="asset.id" class="col-12 col-sm-6 col-md-3">
            <AssetCard :asset="asset" :class="isDarkMode ? 'dark-card' : 'light-card'" />
          </div>
        </div>
      </section>
    </div>

  </QPage>
</template>

<style lang="stylus" scoped>
.project-details
  min-height: 100vh

.border-bottom
  border-bottom: 1px solid rgba(150, 150, 150, 0.2)

.breadcrumb
  letter-spacing: 2px

.round-md
  border-radius: 12px

.round-xs
  border-radius: 4px

.border-light
  border: 1px solid rgba(255, 255, 255, 0.1)

.bg-surface
  background: #111111

.shadow-lg
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5)

.border-primary-glow
  border: 1px solid rgba(34, 211, 238, 0.3)
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.05)

.button-rounded
  border-radius: 8px

.line-height-16
  line-height: 1.8

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

.bom-item:hover
  border-color: rgba(34, 211, 238, 0.5)
  transform: translateY(-2px)

.transition-all
  transition: all 0.3s ease

.content-container
  max-width: 1200px
  margin: 0 auto

@media (max-width: $breakpoint-sm-max)
  .project-image-wrapper
    max-width: 400px
    margin: 0 auto
  .content-container
    padding-top: 24px
  .text-h2
    font-size: 2.5rem
</style>
