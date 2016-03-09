import React from 'react';
import MessageList from './message-list';
import Listener from './listener';
import Sender from './sender';

export default React.createClass({
  getInitialState () {
    return {
      messages: [],
      inputValue: ''
    };
  },

  componentDidMount () {
    var params = { freqMin: 18500, freqMax: 19500 };
    this.sender = new Sender(params);
    this.listener = new Listener(params);
    this.listener.on('message', (message) => {
      if (!this.state.messages.filter(m => m.message === message && m.sent === true).length) {
        this.setState({
          messages: this.state.messages.concat([{ message: message, sent: false }])
        });
      }
    });
    this.listener.start();
  },

  handleFormSubmit (event) {
    event.preventDefault();
    var message = this.state.inputValue;
    this.sender.send(message);
    this.setState({
      inputValue: '',
      messages: this.state.messages.concat([{ message: message, sent: true }])
    });
  },

  handleInputChange (event) {
    var value = event.target.value;
    this.setState({ inputValue: value });
  },

  render () {
    return (
      <div className="chat">
        <MessageList messages={this.state.messages} />
        <form className="chat__new-message" onSubmit={this.handleFormSubmit}>
          <input className="chat__new-message__input" type="text" placeholder="Type a message..." value={this.state.inputValue} onChange={this.handleInputChange} />
          <button className="chat__new-message__send" type="submit">Send</button>
        </form>
      </div>
    );
  }
});
