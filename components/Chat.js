import React from 'react';
import { View, Platform, KeyboardAvoidingView, StyleSheet, AsyncStorage } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import NetInfo from '@react-native-community/netinfo';
import MapView from 'react-native-maps';
import CustomActions from './CustomActions';

const firebase = require('firebase');
require('firebase/firestore');

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      user: {
        _id: '',
        name: '',
        //avatar: ''
      },
      uid: '',
      isConnected: true,
      image: null,
      location: null
    };

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC00jyKkZxfcr8bq2rKz4lpv_ug6mtg6xU",
      authDomain: "chat-app-7cf2f.firebaseapp.com",
      projectId: "chat-app-7cf2f",
      storageBucket: "chat-app-7cf2f.appspot.com",
      messagingSenderId: "911455567284",
      appId: "1:911455567284:web:772ef8d981436495ae46e1",
      measurementId: "G-RBJYV4ETVC",
    };

    if (!firebase.apps || !firebase.apps.length) {
      console.log('setting config');
      firebase.initializeApp(firebaseConfig);
    }

    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {

    const { name } = this.props.route.params;

    this.getMessages();

    this.props.navigation.setOptions({ title: name });
    //this.referenceChatMessages = firebase.firestore().collection("messages");

    //Authenticate user with Firebase
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }

      //update user state with currently active user data
      this.setState({
        user: {
          uid: user.uid,
          name: name,
          //avatar: 'https://placeimg.com/140/140/any',
          createdAt: new Date(),
        },
        messages: [],
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        console.log('online');
      } else {
        console.log('offline');
      }
    });

  }

  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  componentWillUnmount() {

    // Stop listening for authentication
    //this.unsubscribe();

    // Stop listening for collection changes
    this.authUnsubscribe();
  }

  // create a reference to the active user's documents ()
  onAuthStateChanged() {
    this.referenceChatMessagesUser =
      firebase.firestore().collection('messages').where("uid", "==", this.state.uid);
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
        user: {
          _id: data.user._id,
          name: data.user.name,
          //avatar: data.user.avatar,
        },
        image: data.user || '',
        location: data.location || null
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
      image: message.image || null,
      location: message.location || null
    });
  }

  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  }


  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return (
        <InputToolbar
          {...props}
        />
      );
    }
  }


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

  // Import CustomActions to display ActionSheet
  renderCustomActions = (props) => <CustomActions {...props} />;

  //custom map view
  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{
            width: 150,
            height: 100,
            borderRadius: 13,
            margin: 3
          }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
    return null;
  }

  render() {

    const { color } = this.props.route.params;

    return (
      <View style={{ flex: 1, backgroundColor: color }} >
        <GiftedChat
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          renderBubble={this.renderBubble.bind(this)}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={{ _id: 1 }
          } />
        {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    );
  }
}
