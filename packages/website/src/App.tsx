import { Component, RouterView } from '@geajs/core'
import { router } from './router'
import Header from './components/Header'
import Footer from './components/Footer'

export default class App extends Component {
  template() {
    return (
      <div>
        <Header />
        <RouterView router={router} />
        <Footer />
      </div>
    )
  }
}
