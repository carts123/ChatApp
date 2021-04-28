import React from 'react';
import { View, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';

const firebase = require('firebase');
require('firebase/firestore');

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      user: {
        _id: '',
        name: '',
        avatar: '',
      },
    };

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC00jyKkZxfcr8bq2rKz4lpv_ug6mtg6xU",
      authDomain: "chat-app-7cf2f.firebaseapp.com",
      projectId: "chat-app-7cf2f",
      storageBucket: "chat-app-7cf2f.appspot.com",
      messagingSenderId: "911455567284",
      appId: "1:911455567284:web:772ef8d981436495ae46e1",
      measurementId: "G-RBJYV4ETVC"
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    this.props.navigation.setOptions({ title: name });

    //Authenticate user with Firebase
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }

      //update user state with currently active user data
      this.setState({
        user: {
          _id: user.uid,
          name: name,
          avatar: 'https://placeimg.com/140/140/any',
        },
        messages: [],
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
  }

  componentWillUnmount() {

    // Stop listening for authentication
    this.unsubscribe();

    // Stop listening for collection changes
    this.authUnsubscribe();
  }

  // Update messages state when new message is added to Firestore db
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
      });
    });
    this.setState({
      messages,
    });
  };

  // Add new message to Firestore db
  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text || '',
      user: message.user,
    });
  }

  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
        // this.saveMessages();
      }
    );
  }

  // Update messages state when new message is added to Firestore db
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
      });
    });
    this.setState({
      messages,
    });
  };


  // Change styles for chat bubbles
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#757083'
          },
        }}
      />
    )
  }

  render() {

    const { color } = this.props.route.params;

    return (
      <View style={{ flex: 1, backgroundColor: color }} >
        <GiftedChat renderBubble={this.renderBubble.bind(this)} messages={this.state.messages} onSend={(messages) => this.onSend(messages)} user={this.state.user} />
        {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    );
  }
}
