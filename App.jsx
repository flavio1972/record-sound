import React, { useState, useEffect, useRef } from "react";
import { LinearGradient as Background } from "expo-linear-gradient";
import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import Slider from '@react-native-community/slider';;

import { Container, ButtonRecord, Text, colors } from "./styles";

export default function App() {
  const [permission, setPermission] = useState(false);
  const [recordState, setRecordState] = useState({
    isRecording: false,
    isDoneRecording: false,
    durationMillis: 0,
    fileURI: null,
  });
  const [soundState, setSoundState] = useState({
    isLoaded: false,
    durationMillis: 0,
    positionMillis: 0,
    fileURI: null,
    isPlaying: false,
    error: null,
    shouldPlay: false,
    volume: 1.0,
    rate: 1.0,
    didJustFinish: false,
  });
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    askPermission();
  }, []);

  useEffect(() => {
    console.log(
      colors.FgCyan,
      `--> recordingRef: ${recordingRef.current}\n`,
      `--> isRecording: ${recordState.isRecording}\n`,
      `--> isDoneRecording: ${recordState.isDoneRecording}\n`,
      `--> durationMillis: ${recordState.durationMillis}\n`,
      `--> fileURI: ${recordState.fileURI}\n`,
      colors.Reset
    );
  }, [recordState]);

  useEffect(() => {
    console.log(
      colors.FgCyan,
      `--> soundRef: ${soundRef.current}\n`,
      `--> soundState: ${JSON.stringify(soundState)}\n`,
      colors.Reset
    );
  }, [soundState]);

  async function askPermission() {
    const responseAudio = await Audio.requestPermissionsAsync();
    await Audio.setIsEnabledAsync(true);
    setPermission(responseAudio.granted);
  }

  function updateRecordingStatus({
    canRecord,
    isRecording,
    durationMillis,
    isDoneRecording,
  }) {
    setRecordState({
      ...recordState,
      isRecording,
      durationMillis,
    });
  }

  function updateSoundStatus({
    isLoaded,
    error,
    uri,
    durationMillis,
    positionMillis,
    isPlaying,
    shouldPlay,
    volume,
    rate,
    didJustFinish,
    ...status
  }) {
    console.log(status);

    setSoundState({
      ...soundState,
      isLoaded,
      error,
      fileURI: uri,
      durationMillis,
      positionMillis,
      isPlaying,
      shouldPlay,
      volume,
      rate,
      didJustFinish,
    });
  }

  async function onBeginRecording() {
    try {
      if (soundRef.current instanceof Audio.Sound) {
        await soundRef.current.unloadAsync();
        soundRef.current.setOnPlaybackStatusUpdate(null);
      }
      
      if (recordingRef.current instanceof Audio.Recording) {
        recordingRef.current.setOnRecordingStatusUpdate(null);
      }

      recordingRef.current = null;
      soundRef.current = null;
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      const recordingAux = new Audio.Recording();
      recordingAux.setOnRecordingStatusUpdate(updateRecordingStatus);

      await recordingAux.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      recordingRef.current = recordingAux;

      if (recordingRef.current instanceof Audio.Recording) {
        await recordingRef.current.startAsync();
      }

      setRecordState({
        ...recordState,
        isDoneRecording: false,
      });
    } catch (err) {
      console.log(colors.FgRed, `--> ${err}`, colors.Reset);
    }
  }

  async function onEndRecording() {
    try {
      if (recordingRef.current instanceof Audio.Recording) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
      }
    } catch (err) {
      console.log(colors.FgRed, `--> ${err}`, colors.Reset);
    }

    if (recordingRef.current instanceof Audio.Recording) {
      const fileURI = recordingRef.current.getURI();
      recordingRef.current.setOnRecordingStatusUpdate(null);

      const { sound, status } = await recordingRef.current.createNewLoadedSoundAsync(
        {
          isLooping: true,
          volume: soundState.volume,
          rate: soundState.rate,
          isMuted: false,
        },
        updateSoundStatus
      );

      recordingRef.current = null;
      soundRef.current = sound;

      setRecordState({
        ...recordState,
        fileURI,
        isDoneRecording: !recordState.isDoneRecording,
        isRecording: !recordState.isRecording,
      });
    }
  }

  function onRecord() {
    if (recordState.isRecording) {
      console.log(colors.FgGreen, `--> Message: onEnd called...`, colors.Reset);

      onEndRecording();
    } else {
      console.log(
        colors.FgGreen,
        `--> Message: onBegin called...`,
        colors.Reset
      );

      onBeginRecording();
    }
  }

  async function onPlayAudio() {
    if (soundRef.current instanceof Audio.Sound) {
      if (soundState.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  }

  function paddingWithZero(number) {
    const string = number.toString();
    if (number < 10) {
      return "0" + string;
    }
    return string;
  }

  function getMMSSFromMillis(durationMillis) {
    const totalSeconds = durationMillis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    return paddingWithZero(minutes) + ":" + paddingWithZero(seconds);
  }

  function getRecordingTimestamp() {
    if (recordState.durationMillis !== null) {
      return `${getMMSSFromMillis(recordState.durationMillis)}`;
    }
    return `${getMMSSFromMillis(0)}`;
  }

  function positionSliderSound() {
    if (soundRef.current instanceof Audio.Sound) {
      if (soundState.durationMillis && soundState.positionMillis) {
        return soundState.positionMillis / soundState.durationMillis;
      }

      return 0;
    }
  }

  return (
    <Background
      colors={["#F4CE6C", "#E9C260", "#EFC047"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Container>
        {permission ? (
          <>
            <ButtonRecord onPress={onRecord} activeOpacity={1}>
              {recordState.isRecording ? (
                <MCI name="stop" size={100} color="#E18848" />
              ) : (
                <MCI name="microphone" size={100} color="#E18848" />
              )}
            </ButtonRecord>

            <Text>{getRecordingTimestamp()}</Text>

            {soundState.isLoaded && (
              <>
                <ButtonRecord onPress={onPlayAudio}>
                  {soundState.isPlaying ? (
                    <MCI name="pause" size={100} color="#E18848" />
                  ) : (
                    <MCI name="play" size={100} color="#E18848" />
                  )}
                </ButtonRecord>

                <Slider
                  value={(soundState.positionMillis / soundState.durationMillis)}
                />
              </>
            )}
          </>
        ) : (
          <Text>Sorry! Permission not allowed...</Text>
        )}
      </Container>
    </Background>
  );
}
