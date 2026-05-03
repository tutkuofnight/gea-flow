import { Component } from '@geajs/core'
import Hero from '../components/Hero'
import Features from '../components/Features'

export default class Home extends Component {
  template() {
    return (
      <main>
        <Hero />
        <Features />
      </main>
    )
  }
}
