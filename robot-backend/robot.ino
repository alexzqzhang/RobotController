/*
  Arduino Robot Controller
  ========================
  Reads single-char commands from Serial:
    F = Forward      B = Backward
    L = Left         R = Right
    S = Stop         C = Spin Clockwise
    W = Spin Counter-CW   X = Boost
    Vxxx = Set speed (e.g. V180)

  Wiring (L298N Motor Driver):
    IN1 = pin 2,  IN2 = pin 3,  ENA = pin 9   (Left Motor)
    IN3 = pin 4,  IN4 = pin 5,  ENB = pin 10  (Right Motor)
*/

// Motor A (Left)
const int IN1 = 2, IN2 = 3, ENA = 9;
// Motor B (Right)
const int IN3 = 4, IN4 = 5, ENB = 10;

int motorSpeed = 180;

void setup() {
  Serial.begin(9600);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(ENA, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT); pinMode(ENB, OUTPUT);
  stopMotors();
}

void loop() {
  if (!Serial.available()) return;

  char c = Serial.read();

  if (c == 'V') {
    // Read 3-digit speed
    while (Serial.available() < 3) delay(1);
    char buf[4] = {0};
    Serial.readBytes(buf, 3);
    motorSpeed = constrain(atoi(buf), 0, 255);
    analogWrite(ENA, motorSpeed);
    analogWrite(ENB, motorSpeed);
    return;
  }

  switch (c) {
    case 'F': forward();   break;
    case 'B': backward();  break;
    case 'L': turnLeft();  break;
    case 'R': turnRight(); break;
    case 'S': stopMotors();break;
    case 'C': spinCW();    break;
    case 'W': spinCCW();   break;
    case 'X': boost();     break;
  }
}

void setMotors(bool a1, bool a2, bool b1, bool b2, int spd = -1) {
  if (spd < 0) spd = motorSpeed;
  digitalWrite(IN1, a1); digitalWrite(IN2, a2);
  digitalWrite(IN3, b1); digitalWrite(IN4, b2);
  analogWrite(ENA, spd); analogWrite(ENB, spd);
}

void forward()   { setMotors(HIGH, LOW,  HIGH, LOW);  }
void backward()  { setMotors(LOW,  HIGH, LOW,  HIGH); }
void turnLeft()  { setMotors(LOW,  HIGH, HIGH, LOW);  }
void turnRight() { setMotors(HIGH, LOW,  LOW,  HIGH); }
void spinCW()    { setMotors(HIGH, LOW,  LOW,  HIGH); }
void spinCCW()   { setMotors(LOW,  HIGH, HIGH, LOW);  }
void stopMotors(){ setMotors(LOW,  LOW,  LOW,  LOW, 0); }
void boost()     { setMotors(HIGH, LOW,  HIGH, LOW, 255); }
