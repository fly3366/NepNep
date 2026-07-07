import { defineComponent } from 'vue'
import { Container } from './components/Container'
import { NConfigProvider } from 'naive-ui'

export const App = defineComponent({
  name: 'App',
  setup() {
    return () =>
      <NConfigProvider
        style="height: 100%;"
      >
        <Container />
      </NConfigProvider>
  }
})