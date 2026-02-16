<script>
import { mapState, mapGetters } from 'vuex'
import { matClose, matDeleteOutline, matPhotoCamera, matLink, matAdd, matKeyboardArrowDown, matUploadFile } from '@quasar/extras/material-icons'

import AppUploadMixin from 'src/mixins/AppUpload'
import PageComponentMixin from 'src/mixins/pageComponent'

import axios from 'axios'
import { getS3SignedUrl } from 'src/utils/s3'
import logger from 'src/utils/logger'

export default {
  mixins: [
    PageComponentMixin,
    AppUploadMixin,
  ],
  data () {
    return {
      projectTitle: '',
      projectTitleMaxLength: 70,
      category: 'Arduino',
      categoryOptions: ['Arduino', 'Raspberry Pi', 'ESP32', 'Sensors', 'Robotics'],
      difficulty: 'Intermediate',
      difficultyOptions: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      description: '',
      descriptionMaxLength: 2000,
      tags: ['IoT', 'Automation'],
      newTag: '',
      showTagInput: false,
      narublockFile: null,
      narublockFileName: '',
      assetImages: [],
      newUserImages: [],
      uploaderFiles: [],
      creatingAsset: false,
    }
  },
  computed: {
    ...mapState([
      'style',
      'content',
    ]),
    ...mapGetters([
      'currentUser',
    ]),
    uploadFolder () {
      return 'images'
    },
    canPublish () {
      return this.projectTitle.length > 0 &&
        this.description.length > 0 &&
        this.narublockFile !== null
    },
  },
  created () {
    this.icons = {
      matClose,
      matDeleteOutline,
      matPhotoCamera,
      matLink,
      matAdd,

      matKeyboardArrowDown,
      matUploadFile,
    }
  },
  methods: {
    goBack () {
      this.$router.go(-1)
    },
    saveDraft () {
      this.notifySuccess('notification.saved')
    },
    // Gallery image methods
    filterCompleteFiles (files) {
      return files.filter(f => f.name && f.url)
    },
    uploaderFilesChanged (files) {
      this.uploaderFiles = files
      this.assetImages = this.filterCompleteFiles(files)
    },
    removeImage (removed) {
      this.newUserImages = this.newUserImages.filter(img => img.name !== removed.name)
    },
    uploadCompleted ({ transformedUploadedFiles, uploadedOrReused }) {
      this.assetImages = uploadedOrReused
      this.newUserImages = transformedUploadedFiles

      if (this.creatingAsset) this.publishProject()
    },
    // Narublock file upload
    triggerFileUpload () {
      this.$refs.narublockInput.click()
    },
    onNarublockFileSelected (event) {
      const file = event.target.files[0]
      if (file) {
        this.narublockFile = file
        this.narublockFileName = file.name
      }
    },

    async uploadNarublockFile () {
      if (!this.narublockFile) return null

      try {
        const { fields, url, S3FileUrl, headers } = await getS3SignedUrl(this.narublockFile, { folder: 'files' })
        
        const formData = new FormData()
        fields.forEach(({ name, value }) => {
          formData.append(name, value)
        })
        formData.append('file', this.narublockFile)

        // Convert headers array to object for axios
        const headersObj = {}
        if (headers && headers.length) {
          headers.forEach(({ name, value }) => {
            headersObj[name] = value
          })
        }

        await axios.post(url, formData, { headers: headersObj })
        
        return S3FileUrl
      } catch (err) {
        logger(err)
        throw new Error('Failed to upload Narublock file')
      }
    },
    // Tags
    addTag () {
      if (!this.showTagInput) {
        this.showTagInput = true
        this.$nextTick(() => {
          this.$refs.tagInput && this.$refs.tagInput.focus()
        })
        return
      }
      if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
        this.tags.push(this.newTag.trim())
        this.newTag = ''
      }
    },
    removeTag (index) {
      this.tags.splice(index, 1)
    },
    // Publish
    async publishProject () {
      if (!this.currentUser.id) {
        this.openAuthDialog({ action: 'publish' })
        return
      }

      if (!this.canPublish) return

      try {
        this.creatingAsset = true

        const uploadPending = this.uploaderFiles.length && this.assetImages.length < this.uploaderFiles.length
        if (uploadPending) return

        const images = this.assetImages

        const attrs = {
          name: this.projectTitle.replace('\n', ''),
          description: this.description,
          active: true,
          validated: true,
          metadata: {
            images,
            category: this.category,
            difficulty: this.difficulty,
            tags: this.tags,
            narublockFileName: this.narublockFileName,
          }
        }

        if (this.narublockFile) {
          const narublockFileUrl = await this.uploadNarublockFile()
          attrs.metadata.narublockFileUrl = narublockFileUrl
        }

        if (this.content.currency) {
          attrs.currency = this.content.currency
        }

        const asset = await this.$store.dispatch('createAsset', { attrs })

        this.notifySuccess('notification.saved')
        this.creatingAsset = false

        this.$router.push({ name: 'asset', params: { id: asset.id } })
      } catch (err) {
        this.creatingAsset = false
        logger(err)
        this.notifyWarning('error.unknown_happened_header')
      }
    },
  }
}
</script>

<template>
  <QPage class="upload-project-page">
    <!-- ═══════════════════ HEADER BAR ═══════════════════ -->
    <div class="upload-header">
      <div class="upload-header__left">
        <QBtn
          flat
          dense
          round
          :icon="icons.matClose"
          size="md"
          color="grey-8"
          @click="goBack"
        />
        <span class="upload-header__title">Upload New Project</span>
      </div>
      <QBtn
        flat
        no-caps
        label="Save Draft"
        class="upload-header__draft-btn"
        @click="saveDraft"
      />
    </div>

    <!-- ═══════════════════ FORM BODY ═══════════════════ -->
    <div class="upload-body">
      <!-- Step Indicator -->
      <div class="step-indicator">
        <div class="step-indicator__circle step-indicator__circle--active">
          <span>1</span>
        </div>
        <div class="step-indicator__line step-indicator__line--active" />
        <div class="step-indicator__circle">
          <span>2</span>
        </div>
        <div class="step-indicator__line" />
        <div class="step-indicator__circle">
          <span>3</span>
        </div>
      </div>

      <!-- ═══════ Project Gallery ═══════ -->
      <div class="form-section">
        <div class="form-label">
          <span class="form-label__text">Project Gallery</span>
          <span class="form-label__required">*</span>
        </div>
        <div class="gallery-row">
          <AppGalleryUploader
            @uploader-files-changed="uploaderFilesChanged"
            @upload-completed="uploadCompleted"
            @remove="removeImage"
          />
        </div>
      </div>

      <!-- ═══════ Project Title ═══════ -->
      <div class="form-section">
        <div class="form-label">
          <span class="form-label__text">Project Title</span>
          <span class="form-label__required">*</span>
        </div>
        <QInput
          v-model="projectTitle"
          outlined
          dense
          placeholder="e.g. Smart Home Irrigation System"
          bg-color="white"
          :maxlength="projectTitleMaxLength"
          class="upload-input"
        />
      </div>

      <!-- ═══════ Category & Difficulty ═══════ -->
      <div class="form-section form-row">
        <div class="form-col">
          <div class="form-label">
            <span class="form-label__text">Category</span>
            <span class="form-label__required">*</span>
          </div>
          <QSelect
            v-model="category"
            :options="categoryOptions"
            outlined
            dense
            bg-color="white"
            :dropdown-icon="icons.matKeyboardArrowDown"
            class="upload-input"
          />
        </div>
        <div class="form-col">
          <div class="form-label">
            <span class="form-label__text">Difficulty</span>
          </div>
          <QSelect
            v-model="difficulty"
            :options="difficultyOptions"
            outlined
            dense
            bg-color="white"
            :dropdown-icon="icons.matKeyboardArrowDown"
            class="upload-input"
          />
        </div>
      </div>

      <!-- ═══════ Narublock File ═══════ -->
      <div class="form-section">
        <div class="form-label">
          <span class="form-label__text">Narublock File</span>
          <span class="form-label__required">*</span>
        </div>
        <input
          ref="narublockInput"
          type="file"
          style="display: none"
          @change="onNarublockFileSelected"
        >
        <QBtn
          outline
          no-caps
          class="upload-file-btn"
          :color="narublockFile ? 'positive' : 'primary'"
          @click="triggerFileUpload"
        >
          <QIcon
            :name="narublockFile ? 'check_circle' : icons.matUploadFile"
            :color="narublockFile ? 'positive' : 'primary'"
            size="20px"
            class="q-mr-sm"
          />
          <span>{{ narublockFile ? narublockFileName : 'Upload Your File' }}</span>
        </QBtn>
        <div class="form-helper-text">
          Link to your code, schematics, or 3D files
        </div>
      </div>

      <!-- ═══════ Description ═══════ -->
      <div class="form-section">
        <div class="form-label">
          <span class="form-label__text">Description</span>
          <span class="form-label__required">*</span>
        </div>
        <QInput
          v-model="description"
          outlined
          type="textarea"
          placeholder="Explain how your project works, components used, and assembly steps..."
          bg-color="white"
          :maxlength="descriptionMaxLength"
          :input-style="{ minHeight: '160px' }"
          class="upload-input"
        />
      </div>

      <!-- ═══════ Tags ═══════ -->
      <div class="form-section">
        <div class="form-label">
          <span class="form-label__text">Tags</span>
        </div>
        <div class="tags-row">
          <QChip
            v-for="(tag, idx) in tags"
            :key="tag"
            removable
            outline
            color="primary"
            text-color="primary"
            class="tag-chip"
            @remove="removeTag(idx)"
          >
            {{ tag }}
          </QChip>
          <QInput
            v-if="showTagInput"
            ref="tagInput"
            v-model="newTag"
            dense
            outlined
            placeholder="Type tag..."
            class="tag-input"
            bg-color="white"
            @keyup.enter="addTag"
          />
          <QBtn
            outline
            no-caps
            color="primary"
            :icon="icons.matAdd"
            label="Add Tag"
            size="sm"
            class="add-tag-btn"
            @click="addTag"
          />
        </div>
      </div>

      <!-- ═══════ Divider ═══════ -->
      <QSeparator class="q-my-lg" />

      <!-- ═══════ Actions ═══════ -->
      <div class="form-actions">
        <QBtn
          flat
          no-caps
          label="Cancel"
          color="grey-7"
          class="action-btn"
          @click="goBack"
        />
        <QBtn
          unelevated
          no-caps
          label="Publish Project"
          color="primary"
          text-color="white"
          class="action-btn"
          :loading="creatingAsset"
          :disable="!canPublish"
          @click="publishProject"
        />
      </div>
    </div>

    <!-- ═══════════════════ FOOTER BAR ═══════════════════ -->
    <div class="upload-footer">
      <QIcon
        name="info"
        color="amber-8"
        size="16px"
      />
      <span class="upload-footer__text">
        By publishing, you agree to the CircuitShare Terms of Service and CC BY-NC-SA 4.0 License.
      </span>
    </div>
  </QPage>
</template>

<style lang="stylus" scoped>
// ═══════════════ Design Tokens ═══════════════
$upload-max-width = 720px
$border-color = #E5E7EB
$bg-page = #F9FAFB
$bg-card = #FFFFFF
$radius-sm = 4px
$radius-md = 8px
$text-primary = #111827
$text-secondary = #6B7280
$accent = #4F46E5

// ═══════════════ Page ═══════════════
.upload-project-page
  background $bg-page
  min-height 100vh
  display flex
  flex-direction column

// ═══════════════ Header ═══════════════
.upload-header
  background $bg-card
  border-bottom 1px solid $border-color
  padding 16px 24px
  display flex
  align-items center
  justify-content space-between

.upload-header__left
  display flex
  align-items center
  gap 16px

.upload-header__title
  font-size 20px
  font-weight 700
  color $text-primary
  letter-spacing -0.2px

.upload-header__draft-btn
  color $text-secondary !important
  font-weight 600
  font-size 14px

// ═══════════════ Body ═══════════════
.upload-body
  max-width $upload-max-width
  width 100%
  margin 0 auto
  padding 32px 24px
  flex 1

// ═══════════════ Step Indicator ═══════════════
.step-indicator
  display flex
  align-items center
  justify-content center
  gap 0
  margin-bottom 32px

.step-indicator__circle
  width 32px
  height 32px
  border-radius 50%
  display flex
  align-items center
  justify-content center
  font-weight 700
  font-size 14px
  border 2px solid $border-color
  color $text-secondary
  background $bg-card
  transition all 0.25s ease

.step-indicator__circle--active
  border-color $accent
  background $accent
  color white
  box-shadow 0 0 0 4px rgba(79, 70, 229, 0.12)

.step-indicator__line
  width 48px
  height 2px
  background $border-color
  transition background 0.25s ease

.step-indicator__line--active
  background $accent

// ═══════════════ Form Sections ═══════════════
.form-section
  margin-bottom 24px

.form-label
  margin-bottom 6px
  display flex
  align-items center
  gap 4px

.form-label__text
  font-size 14px
  font-weight 600
  color $text-primary

.form-label__required
  color #EF4444
  font-weight 700

.form-helper-text
  font-size 11px
  font-weight 500
  color $text-secondary
  margin-top 4px
  line-height 1.3

.upload-input
  width 100%

// ═══════════════ Row Layout ═══════════════
.form-row
  display flex
  gap 24px

  @media (max-width: 600px)
    flex-direction column
    gap 16px

.form-col
  flex 1

// ═══════════════ File Upload Button ═══════════════
.upload-file-btn
  width 100%
  height 48px
  border-radius $radius-sm !important
  font-weight 600
  font-size 14px
  justify-content flex-start
  text-transform none
  border 1.5px dashed currentColor !important
  transition all 0.2s ease

  &:hover
    background rgba(79, 70, 229, 0.04) !important

// ═══════════════ Tags ═══════════════
.tags-row
  display flex
  flex-wrap wrap
  gap 8px
  align-items center

.tag-chip
  font-weight 600
  font-size 13px

.tag-input
  width 120px

.add-tag-btn
  font-weight 600
  border-radius $radius-sm !important

// ═══════════════ Actions ═══════════════
.form-actions
  display flex
  justify-content flex-end
  gap 16px

.action-btn
  height 44px
  min-width 100px
  font-weight 600
  font-size 14px
  border-radius $radius-sm !important

// ═══════════════ Footer ═══════════════
.upload-footer
  background $bg-card
  border-top 1px solid $border-color
  padding 16px 24px
  display flex
  align-items center
  justify-content center
  gap 8px

.upload-footer__text
  font-size 11px
  font-weight 500
  color $text-secondary
  line-height 1.3
</style>
