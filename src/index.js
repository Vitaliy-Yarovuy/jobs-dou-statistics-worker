// import scrapper from 'jobs-dou-statistics-scrapper';

// scrapper.grabCategories().then(function(categories){
//     console.log(categories);
// })


const toggleSignIn = () => {
    if (!firebase.auth().currentUser) {
        var provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider).then((result) => {
            var token = result.credential.accessToken;
            var user = result.user;
            console.log(user, token);

        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            if (errorCode === 'auth/account-exists-with-different-credential') {
                alert('You have already signed up with a different auth provider for that email.');
                // If you are using multiple auth providers on your app you should handle linking
                // the user's accounts here.
            } else {
                console.error(error);
            }
        });
    } else {
        firebase.auth().signOut();
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('loginButton');
    loginButton.addEventListener('click', toggleSignIn);

    const processButton = document.getElementById('process');
    
    processButton.addEventListener('click', async ()=>{
      const token = await firebase.auth().currentUser.getToken(true);

      // sendMessage({
      //   command: 'GET_NEW',
      //   token
      // });

    });

    firebase.auth().onAuthStateChanged((user)=>{
        if (user) {
          // User is signed in.
          console.log(user);
          loginButton.innerHTML = `logout(${user.displayName})`;
        } else {
          loginButton.innerHTML = `log in`;
        }
      });

});


// function sendMessage(message) {
//     // This wraps the message posting/response in a promise, which will resolve if the response doesn't
//     // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
//     // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
//     // a convenient wrapper.
//     return new Promise(function(resolve, reject) {
//       var messageChannel = new MessageChannel();
//       messageChannel.port1.onmessage = function(event) {
//         if (event.data.error) {
//           reject(event.data.error);
//         } else {
//           resolve(event.data);
//         }
//       };
  
//       // This sends the message data as well as transferring messageChannel.port2 to the service worker.
//       // The service worker can then use the transferred port to reply via postMessage(), which
//       // will in turn trigger the onmessage handler on messageChannel.port1.
//       // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
//       (navigator.serviceWorker.controller || serviceWorkerController).postMessage(message,
//         [messageChannel.port2]);
//     });
//   }

// let serviceWorkerController;

navigator.serviceWorker.register('/sw.bundle.js').then(function(registration) {
  registration.periodicSync.register({
    tag: 'ping',         // default: ''
    minPeriod: 1 * 60 ,//12 * 60 * 60 * 1000, // default: 0
    powerState: 'avoid-draining',   // default: 'auto'
    networkState: 'avoid-cellular'  // default: 'online'
  }).then(function(periodicSyncReg) {
    // success
  }, function() {
    // failure
  })
});



// .then(function(reg) {
//   // registration worked
//   console.log('Registration succeeded. Scope is ' + reg.scope);
//   serviceWorkerController = reg.active;
// })
// .then(function() {
//   return navigator.serviceWorker.ready.then(function(swRegistration) {
//     debugger;
//     console.log(swRegistration);
//     return swRegistration.sync.register('myFirstSync');
//   });
// })
// .then(function(){
// })
// .catch(function(error) {
//   // registration failed
//   console.log('Registration failed with ' + error);
// });

// if ('serviceWorker' in navigator && 'SyncManager' in window) {
//   navigator.serviceWorker.ready.then(function(reg) {
//     return reg.sync.register('tag-name');
//   }).catch(function() {
//     // system was unable to register for a sync,
//     // this could be an OS-level restriction
//     postDataFromThePage();
//   });
// } else {

