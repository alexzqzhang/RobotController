void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);

  // Flash once to show the board has reset and is ready
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("Arduino Ready");
}

void loop() {
  if (Serial.available() > 0) {
    char incoming = Serial.read();

    if (incoming == '1') {
      digitalWrite(LED_BUILTIN, HIGH);
      Serial.println("LED ON");
    } else if (incoming == '0') {
      digitalWrite(LED_BUILTIN, LOW);
      Serial.println("LED OFF");
    } else if (incoming == 'F') {
      digitalWrite(LED_BUILTIN, HIGH);  // turn the LED on (HIGH is the voltage level)
    } else if (incoming == 'B') {
      digitalWrite(LED_BUILTIN, LOW);   // turn the LED off by making the voltage LOW
    }
  }
}