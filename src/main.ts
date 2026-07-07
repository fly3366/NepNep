import { createApp } from 'vue'
import naive from 'naive-ui'

import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

import { App } from './App'
import './index.css'

createApp(App).use(naive).mount('#app')
