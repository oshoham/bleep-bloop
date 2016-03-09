import React from 'react';
import classNames from 'classnames';

export default React.createClass({
  propTypes: {
    messages: React.PropTypes.arrayOf(React.PropTypes.shape({
      message: React.PropTypes.string,
      sent: React.PropTypes.bool
    })).isRequired
  },

  render () {
    var list = this.props.messages.map(function ({ message, sent }, i) {
      var liClass = classNames({
        'chat__message-list__message': true,
        'chat__message-list__message--sent': sent,
        'chat__message-list__message--received': !sent
      });

      return (
        <li className={liClass} key={i}>
          {message}
        </li>
      );
    });

    return (
      <ul className="chat__message-list">
        {list}
      </ul>
    );
  }
});
