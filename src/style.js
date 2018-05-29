import React from 'react'
import PropTypes from 'prop-types'
import compile from 'styled-css-loader/compile'
import { ThemeContext } from './theme'

const isClient = typeof window !== 'undefined'
class Style extends React.PureComponent {
  static propTypes = {
    sheet: PropTypes.shape({ css: PropTypes.string.isRequired, id: PropTypes.string.isRequired }),
    independent: PropTypes.bool,
  }

  static defaultProps = {
    independent: undefined,
  }

  static contextTypes = {
    addStyle: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const { sheet, independent } = this.props
    this.update = this.context.addStyle(sheet.id, this.getCSS(), independent)

    if (process.env.NODE_ENV !== 'production') {
      if (!Style.watch) {
        // eslint-disable-next-line
        window.STYLED_CSS_DEV$SHEET = {}
        // eslint-disable-next-line
        window.STYLED_CSS_DEV$ON_SHEET_CHANGE = updatedSheet => {
          // eslint-disable-next-line
          window.STYLED_CSS_DEV$SHEET[updatedSheet.id] = updatedSheet
          if (Style.consumers[updatedSheet.id]) {
            Style.consumers[updatedSheet.id].forEach(fn => fn(updatedSheet))
          }
        }

        Style.consumers = {}
        Style.watch = (id, fn) => {
          if (!Style.consumers[id]) {
            Style.consumers[id] = []
          }

          Style.consumers[id].push(fn)
          return () => {
            Style.consumers[id] = Style.consumers[id].filter(consumer => consumer !== fn)
          }
        }
      }

      this.unwatch = Style.watch(sheet.id, updatedSheet => {
        this.sheet = updatedSheet
        this.update(this.getCSS())
      })
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.variables !== this.props.variables) {
      this.update(this.getCSS())
    }
  }

  componentWillUnmount() {
    this.update(null, true)
    if (this.unwatch) {
      this.unwatch()
    }
  }

  getCSS() {
    const sheet = this.sheet || this.props.sheet
    const { variables } = this.props

    if (process.env.NODE_ENV !== 'production') {
      if (isClient) {
        // eslint-disable-next-line
        if (!window.STYLED_CSS_DEV$SHEET) {
          // eslint-disable-next-line
          window.STYLED_CSS_DEV$SHEET = {}
        }

        return compile(
          // eslint-disable-next-line
          window.STYLED_CSS_DEV$SHEET[sheet.id] || sheet,
          variables || {},
        )
      }
    }

    return compile(sheet, variables || {})
  }

  render() {
    if (!isClient) {
      const { independent, sheet } = this.props
      this.context.addStyle(sheet.id, this.getCSS(), independent)
    }

    return null
  }
}

export const UnthemedStyle = Style

// Style consuming theme
const ThemedStyle = ({ variables, ...props }) => (
  <ThemeContext.Consumer>
    {theme => <Style {...props} variables={variables ? { ...theme, ...variables } : theme} />}
  </ThemeContext.Consumer>
)
ThemedStyle.displayName = 'ThemedStyle'
export default ThemedStyle
