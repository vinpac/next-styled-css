/* eslint-disable import/extensions, import/no-unresolved */
import React from 'react'
import PropTypes from 'prop-types'

export const STYLE_ID = '@@styled-css'
export const isClient = typeof window !== 'undefined'

let renderedStyles = []
let styleElement

export function getRenderedCSS() {
  let css = ''
  renderedStyles.forEach(style => {
    css += style.css
  })
  renderedStyles = []
  return css
}

export default function withStyles(Comp) {
  const CreatedStyledProvider = class StylesProvider extends React.Component {
    static childContextTypes = {
      addStyle: PropTypes.func.isRequired,
    }

    static contextTypes = { addStyle: PropTypes.func }

    styles = []

    componentDidMount() {
      if (this.context.addStyle) {
        throw new Error('`withStyles` should only be used at the top-level component.')
      }

      // eslint-disable-next-line no-undef
      styleElement = document.getElementById(STYLE_ID)
    }

    getChildContext() {
      return { addStyle: this.addStyle }
    }

    update = () => {
      if (!styleElement) {
        return
      }

      let css = ''
      this.styles.forEach(style => {
        css += style.css
      })
      styleElement.innerHTML = css
    }

    addStyle = (id, css, independent) => {
      let style = this.styles.find(s => {
        if (independent) {
          return s.css === css
        }

        return s.id === id
      })
      let isSharedStyle = !!style

      if (style && style.css !== css) {
        if (!independent) {
          throw new Error(
            'Tried to add same stylesheet with different content. ' +
              'If this is intended use <Style independent />',
          )
        }

        style = undefined
      }

      if (!style) {
        style = { id, instances: 1, css }
        this.styles.push(style)
        this.update()
      } else {
        style.instances += 1
      }

      if (!isClient) {
        renderedStyles = this.styles
        return undefined
      }

      return (updatedCSS, mustRemove) => {
        if (mustRemove) {
          style.instances -= 1

          if (style.instances === 0) {
            this.styles.splice(this.styles.indexOf(style), 1)
            this.update()
          }

          return
        }

        if (style.css === updatedCSS) {
          return
        }

        if (independent && isSharedStyle) {
          // Create a new style when the sheet changes after using an equal style before
          isSharedStyle = false
          style = { id, css: updatedCSS }
          this.styles.push(style)
        } else {
          style.css = updatedCSS
        }

        this.update()
      }
    }

    render() {
      return <Comp {...this.props} />
    }
  }

  CreatedStyledProvider.getInitialProps = Comp.getInitialProps
  return CreatedStyledProvider
}
