import React from 'react'
import PropTypes from 'prop-types'

export const ThemeContext = React.createContext({})
const Theme = ({ variables, children }) => (
  <ThemeContext.Consumer>
    {theme => (
      <ThemeContext.Provider value={{ ...theme, ...variables }}>{children}</ThemeContext.Provider>
    )}
  </ThemeContext.Consumer>
)

Theme.displayName = 'Theme'
Theme.propTypes = {
  children: PropTypes.node,
  variables: PropTypes.object.isRequired,
}
Theme.defaultProps = {
  children: null,
}

export default Theme
