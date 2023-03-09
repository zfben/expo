import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {LinkingOptions, NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import React from 'react';
import {Button, Platform, Text} from 'react-native';
import TestSuite from 'test-suite/AppNavigator';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {shareAsync} from 'expo-sharing';


import Colors from './src/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import {View, Image} from "react-native";
import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';

type NavigationRouteConfigMap = React.ReactElement;

type RoutesConfig = {
  'test-suite': NavigationRouteConfigMap;
  apis?: NavigationRouteConfigMap;
  components?: NavigationRouteConfigMap;
};

type NativeComponentListExportsType = null | {
  [routeName: string]: {
    linking: any;
    navigator: NavigationRouteConfigMap;
  };
};

export function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch {
    return null;
  }
}

const routes: RoutesConfig = {
  'test-suite': TestSuite,
};

// We'd like to get rid of `native-component-list` being a part of the final bundle.
// Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
// See `babel.config.js` and `moduleResolvers/nullResolver.js` for more details.
const NativeComponentList: NativeComponentListExportsType = optionalRequire(() =>
  require('native-component-list/src/navigation/MainNavigators')
) as any;
const Redirect = optionalRequire(() =>
  require('native-component-list/src/screens/RedirectScreen')
) as any;
const Search = optionalRequire(() =>
  require('native-component-list/src/screens/SearchScreen')
) as any;

const nclLinking: Record<string, any> = {};
if (NativeComponentList) {
  routes.apis = NativeComponentList.apis.navigator;
  routes.components = NativeComponentList.components.navigator;
  nclLinking.apis = NativeComponentList.apis.linking;
  nclLinking.components = NativeComponentList.components.linking;
}

const Tab = createBottomTabNavigator();
const Switch = createStackNavigator();

const linking: LinkingOptions<object> = {
  prefixes: [
    Platform.select({
      web: Linking.createURL('/', {scheme: 'bareexpo'}),
      default: 'bareexpo://',
    }),
  ],
  config: {
    screens: {
      main: {
        initialRouteName: 'test-suite',
        screens: {
          'test-suite': {
            path: 'test-suite',
            screens: {
              select: '',
              run: '/run',
            },
          },

          ...nclLinking,
        },
      },
    },
  },
  // react-navigation internally has a 150ms timeout for `Linking.getInitialURL`.
  // https://github.com/react-navigation/react-navigation/blob/f93576624282c3d65e359cca2826749f56221e8c/packages/native/src/useLinking.native.tsx#L29-L37
  // The timeout is too short for GitHub Actions CI with Hermes and causes test failures.
  // For detox testing, we use the raw `Linking.getInitialURL` instead.
  ...(global.DETOX ? {getInitialURL: Linking.getInitialURL} : null),
};


const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  </head>
  <body style="text-align: center;">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"
      style="width: 10vw;" />
  </body>
</html>
`;


function TabNavigator() {
  const [image, setImage] = React.useState(null);
  const [imageUri, setImageUri] = React.useState(null);

  function getMessage() {
    return Print.syncFunction('bar');
  }

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const {uri} = await FileSystem.downloadAsync(
      'https://via.placeholder.com/300x600',
      FileSystem.documentDirectory + 'pepe.jpg'
    );

    Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      UTI: 'JPEG',
    }).then(() => {
      setTimeout(() => {
        Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          UTI: 'JPEG',
        });
      }, 1000)
    });
  };
  React.useEffect(() => {
    setTimeout(async () => {
      console.log("Sending print attack")
      for (let i = 0; i < 4; i++) {
        printToFile().then()
      }
    }, 500)
  }, [])


  const [selectedPrinter, setSelectedPrinter] = React.useState();

  const print = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    await Print.printAsync({
      html,
      printerUrl: selectedPrinter?.url, // iOS only
      useMarkupFormatter: false,
    });
  };

  const printToFile = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    const {uri, numberOfPages, base64} = await Print.printToFileAsync({
      html,
      base64: false,
      useMarkupFormatter: false,
      margins: {
        left: 100,
        right: 100,
        top: 100,
        bottom: 0
      }
    });

    console.log('File has been saved to:', uri);
    // await shareAsync(uri, {UTI: '.pdf', mimeType: 'application/pdf'});
  };
  const toFileThenReal = async () => {
    const {uri, numberOfPages, base64} = await Print.printToFileAsync({
      html,
      base64: false,
      useMarkupFormatter: false,
      margins: {
        left: 100,
        right: 100,
        top: 100,
        bottom: 0
      }
    });
    const result = await Print.printAsync({
      printerUrl: selectedPrinter?.url,
      uri: uri
    })
    console.log(result)
  }

  const multiPrintBug = async () => {
    const imgHtml =
      `<html>
    <head>
	    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=yes" />
	    <style>
		    @page {
			    margin: 0;
		    }
		    body {
			    height: 1.4in;
			    width: 3.5in;
			    margin: 0;
			    padding: 0;
			    overflow: hidden;
			    align-items: center;
			    justify-content: center;
		    }
		    img {
			    height: 100%;
			    width: 100%;
		    }
	    </style>
    </head>
    <body>
	    <img src="data:image/png;base64,${"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"}" />
    </body>
</html>`;


    await Print.printAsync({
      html: imgHtml,
      margins: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      useMarkupFormatter: true,
      orientation: "landscape",
      printerUrl: "ipp://wojciech-81ym.local.:631/printers/Stylus-SX100"
    }).then(() => {
      Print.printAsync({
        html: imgHtml,
        margins: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        },
        useMarkupFormatter: true,
        orientation: "landscape",
        printerUrl: "ipp://wojciech-81ym.local.:631/printers/Stylus-SX100"
      })
      resolve(true);
    }).catch((err_1) => {
      resolve(false);
    });

  }
  const selectPrinter = async () => {
    const printer = await Print.selectPrinterAsync(); // iOS only
    setSelectedPrinter(printer);
  };

  const testShare = async () => {
    const { uri } = await FileSystem.downloadAsync(
      'https://via.placeholder.com/300x600',
      FileSystem.documentDirectory + 'pepe.jpg'
    );
    console.log(uri)
    // Sharing.suspendFunction("Dupa dupa")

    Sharing.suspendFunction(uri, {
      mimeType: 'image/jpeg',
      UTI: 'JPEG',
    }).then(()=>{
      console.log("Resolved")
    }).catch((err) => {
      console.log(err)
    });
  }

  const originalShare = async () => {
    const { uri } = await FileSystem.downloadAsync(
      'https://via.placeholder.com/300x600',
      FileSystem.documentDirectory + 'pepe.jpg'
    );
    console.log(uri)
    // Sharing.suspendFunction("Dupa dupa")

    Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      UTI: 'JPEG',
    }).then(()=>{
      console.log("Resolved")
    }).catch((err) => {
      console.log(err)
    });
  }


  return (
    <View style={{flex: 1}}>
      <Button title="Print" onPress={print}/>

      <Button title="Print to PDF file" onPress={printToFile}/>
      <Button title="Print" onPress={print}/>
      <Button title="Print to file and print the file" onPress={print}/>
      <Button title={"Multi print bug  test"} onPress={multiPrintBug}/>
      <Button title={"Original share"} onPress={originalShare}/>

      <Button title={"My Share"} onPress={testShare}/>
      {Platform.OS === 'ios' && (
        <>
          <Button title="Select printer" onPress={selectPrinter}/>

          {selectedPrinter ? (
            <Text>{`Selected printer: ${selectedPrinter.name} ${selectedPrinter.url}`}</Text>
          ) : undefined}
        </>
      )}
    </View>
    // <View style={{flex:1, backgroundColor:'red'}}>
    //
    //   {image && <Image
    //       style={{flex: 1,
    //         width: '100%',
    //         height: '100%',
    //         resizeMode: 'contain',}}
    //       source={{uri: image}}/>}
    //   <Tab.Navigator
    //       screenOptions={{
    //         headerShown: false,
    //         tabBarActiveTintColor: Colors.activeTintColor,
    //         tabBarInactiveTintColor: Colors.inactiveTintColor,
    //       }}
    //       safeAreaInsets={{
    //         top: 5,
    //       }}
    //       initialRouteName="test-suite">
    //     {Object.keys(routes).map((name) => (
    //         <Tab.Screen
    //             name={name}
    //             key={name}
    //             component={routes[name]}
    //             options={routes[name].navigationOptions}
    //         />
    //     ))}
    //   </Tab.Navigator>
    // </View>

  );
}

export default () => (
  <NavigationContainer linking={linking}>
    <Switch.Navigator screenOptions={{headerShown: false}} initialRouteName="main">
      {Redirect && <Switch.Screen name="redirect" component={Redirect}/>}
      {Search && <Switch.Screen name="searchNavigator" component={Search}/>}
      <Switch.Screen name="main" component={TabNavigator}/>
    </Switch.Navigator>
  </NavigationContainer>
);

