import styled from "styled-components/native";

export const Container = styled.View`
  justify-content: center;
  align-items: center;
`;

export const ButtonRecord = styled.TouchableOpacity`
  background-color: #fbf0d3;
  margin: 20px;
  align-items: center;
  justify-content: center;
  width: 130px;
  height: 130px;
  border-radius: 20px;
`;

export const Text = styled.Text`
  color: #aa6d56;
  font-size: 20px;
  text-transform: uppercase;
`;

export const colors = {
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
};
