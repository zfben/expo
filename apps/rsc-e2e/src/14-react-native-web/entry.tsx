import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  AppRegistry,
  AppState,
  Appearance,
  BackHandler,
  Button,
  CheckBox,
  Clipboard,
  DeviceEventEmitter,
  DeviceInfo,
  Dimensions,
  DrawerLayoutAndroid,
  Easing,
  FlatList,
  I18nManager,
  Image,
  ImageBackground,
  InputAccessoryView,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  LogBox,
  Modal,
  NativeEventEmitter,
  NativeModules,
  PanResponder,
  PermissionsAndroid,
  Picker,
  PixelRatio,
  Platform,
  Pressable,
  ProgressBar,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  SectionList,
  Settings,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Systrace,
  TVEventHandler,
  Text,
  TextInput,
  ToastAndroid,
  Touchable,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  Vibration,
  View,
  VirtualizedList,
  YellowBox,
  createElement,
  findNodeHandle,
  processColor,
  render,
  unmountComponentAtNode,
  useColorScheme,
  useLocaleContext,
  useWindowDimensions,
} from 'react-native';

export default function RNWTest() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>14) React Native Web imports (Server Component)</Text>

      <ActivityIndicator />
      <Button title="button" />
      <CheckBox />
      <Image source={{ uri: 'https://github.com/evanbacon.png' }} />
      <ImageBackground />
      <InputAccessoryView />
      <KeyboardAvoidingView />
      {/* <Modal  /> */}
      <Picker />
      <Pressable />
      <ProgressBar />
      <RefreshControl refreshing />
      <SafeAreaView />
      <ScrollView />
      <StatusBar />
      <Switch />
      <Text>Text</Text>
      <TextInput value="Text Input" />
      {/* <FlatList renderItem={() => <Text>Item</Text>} data={["apples"]}/>
  <SectionList  renderItem={() => <Text>Item</Text>} sections={[
    {data: ['apples'], title: 'Fruits'}
  ]} /> */}
      {/* <Touchable><Text>Touchable</Text></Touchable> */}
      <TouchableHighlight>
        <Text>TouchableHighlight</Text>
      </TouchableHighlight>
      <TouchableNativeFeedback>
        <Text>TouchableNativeFeedback</Text>
      </TouchableNativeFeedback>
      <TouchableOpacity>
        <Text>TouchableOpacity</Text>
      </TouchableOpacity>
      <TouchableWithoutFeedback>
        <Text>TouchableWithoutFeedback</Text>
      </TouchableWithoutFeedback>
      {/* <VirtualizedList  /> */}
      <View />
    </View>
  );
}
