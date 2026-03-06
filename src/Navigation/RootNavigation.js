import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Signup from '../Screen/Signup';
import Signupdetail from '../Screen/Signupdetail';
import LoginDetail from '../Screen/Logindetail';
import Diversionscreen from '../Screen/Diversionscreen';
import TabNavigation from './TabNavigation';
import Qbanksubject from '../Screen/Qbanksubject';
import Subjectdetail from '../Screen/Subjectdetail';
import Topicwise from '../Screen/Topicwise';
import Chapterwise from '../Screen/Chapterwise';
import Fornixqbank1 from '../Screen/Fornixqbank1';
import Fornixqbank2 from '../Screen/Fornixqbank2';
import Mood from '../Screen/Mood';
import QuizMain from '../Screen/Quizmain';
import Quizpage from '../Screen/Quizpage';
import Topiclist from '../Screen/Topiclist';
import Home from '../Screen/Home';
import Editprofile from '../Screen/Editprofile';
import Selected from '../Screen/Selected';
import CourseSunscription from '../Screen/CourseSunscription';
import Course from '../Screen/Course';
import Review from '../Screen/Review';
import Successful from '../Screen/Successful';
import Results from '../Screen/Results';
import History from '../Screen/History'
import CheckAttempted from '../Screen/CheckAttempted';
import CourseChoose from '../Screen/CourseChoose';
import Notes from '../Screen/Notes';
import PdfViewer from '../Screen/PdfViewer';
import AnalysisScreen from '../Screen/AnalysisScreen';
import SmartTracking from '../Screen/SmartTracking';
import CCDPodcast from '../Screen/CCDPodcast';
import MockTest from '../Screen/MockTest';
import PYTS from '../Screen/PYTS';
import PYTsTopicScreen from '../Screen/PYTsTopicScreen';
import SubjectPodcasts from '../Screen/SubjectPodcasts';
import BasicPlan from '../Screen/Basicplan';
import TestAndDiscussion from '../Screen/TestAndDiscussion';
import DiscussionDetails from '../Screen/DiscussionDetails';
import MockTestResults from '../Screen/MockTestResults';
import CheckAttemptedTest from '../Screen/CheckAttemptedTest';
import AiBot from '../Screen/AiBot';
import AIChatSessionsScreen from '../Screen/AIChatSessionsScreen';
import ForgotPassword from '../Screen/ForgotPassword';
import UniversityExams from '../Screen/UniversityExams';
// import { configureGoogle } from '../Screen/GoogleConfig';




const Stack = createNativeStackNavigator();

function RootNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Signup"
          component={Signup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signupdetail"
          component={Signupdetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Logindetail"
          component={LoginDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Diversionscreen"
          component={Diversionscreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TabNavigation"
          component={TabNavigation}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Qbanksubject"
          component={Qbanksubject}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Subjectdetail"
          component={Subjectdetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Topicwise"
          component={Topicwise}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chapterwise"
          component={Chapterwise}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Fornixqbank1"
          component={Fornixqbank1}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Fornixqbank2"
          component={Fornixqbank2}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Mood"
          component={Mood}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Quizmain"
          component={QuizMain}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Quizpage"
          component={Quizpage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Topiclist"
          component={Topiclist}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Editprofile"
          component={Editprofile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Selected"
          component={Selected}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='Course'
          component={Course}
          options={{ headerShown: false }} />
        <Stack.Screen
          name='Review'
          component={Review}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='Successful'
          component={Successful}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='Results'
          component={Results}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='History'
          component={History}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='CheckAttempted'
          component={CheckAttempted}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='CourseChoose'
          component={CourseChoose}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='Notes'
          component={Notes}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='PdfViewer'
          component={PdfViewer}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='AnalysisScreen'
          component={AnalysisScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='SmartTracking'
          component={SmartTracking}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='CCDPodcast'
          component={CCDPodcast}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='MockTest'
          component={MockTest}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='PYTS'
          component={PYTS}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='PYTsTopicScreen'
          component={PYTsTopicScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='SubjectPodcasts'
          component={SubjectPodcasts}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='BasicPlan'
          component={BasicPlan}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CourseSunscription"
          component={CourseSunscription}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='TestAndDiscussion'
          component={TestAndDiscussion}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='DiscussionDetails'
          component={DiscussionDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='MockTestResults'
          component={MockTestResults}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='CheckAttemptedTest'
          component={CheckAttemptedTest}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='AiBot'
          component={AiBot}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='AIChatSessionsScreen'
          component={AIChatSessionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='UniversityExams'
          component={UniversityExams}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name='ForgotPassword'
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen
          name='GoogleConfig'
          component={configureGoogle}
          options={{ headerShown: false }}
        /> */}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigation;
