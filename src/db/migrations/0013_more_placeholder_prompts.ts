// PLACEHOLDER CONTENT — marked in the database (is_placeholder = 1), not in the text.
//
// Fills each age group out to 50 placeholder prompts (3 existing + 47 here), so a deck
// runs long enough to feel like the real thing while the content team's library is
// pending. Every prompt is Free tier and safe and positive for its age group, with a
// situation and three twists (Gentle, Deeper, Challenging), like 0012. The
// general tips (0002) cover them; they have no prompt-specific tips.
//
// Also adds the three library categories the app didn't have yet (Rites of Passage,
// Travel & Adventure, Humor & Social Dynamics), so placeholders span all seven.
//
// The real library replaces these rows WHERE is_placeholder = 1.

import * as SQLite from 'expo-sqlite';

const CATEGORY: Record<string, string> = {
  E: 'cat-ethics',
  M: 'cat-emotions',
  F: 'cat-fun',
  S: 'cat-school',
  R: 'cat-rites',
  T: 'cat-travel',
  H: 'cat-humor',
};

const SITUATION: Record<string, string> = {
  C: 'ls-car-ride',
  B: 'ls-bedtime',
  M: 'ls-mealtime',
  W: 'ls-waiting-room',
};

const NEW_CATEGORIES = [
  { id: 'cat-rites', name: 'Rites of Passage', order: 5, icon: 'award' },
  { id: 'cat-travel', name: 'Travel & Adventure', order: 6, icon: 'map' },
  { id: 'cat-humor', name: 'Humor & Social Dynamics', order: 7, icon: 'smile' },
];

// [category, situations, prompt, [Gentle, Deeper, Challenging]]
type Row = [string, string, string, [string, string, string]];

const PROMPTS: Record<'3-5' | '6-8' | '9-12' | '13-15', Row[]> = {
  '3-5': [
    ['E', 'W', 'What if your friend falls down on the playground?', ['What if your friend started to cry?', 'What if you were the one who bumped into them?', 'What if no grown-ups were nearby?']],
    ['E', 'M', 'What if you have two cookies and your friend has none?', ['What if they were your very favorite cookies?', "What if your friend didn't ask for one?", 'What if you were still really hungry?']],
    ['E', 'B', 'What if you find a toy at the park that isn\'t yours?', ['What if it was a toy you always wanted?', 'What if nobody else was at the park?', 'What if you saw a kid looking for something?']],
    ['E', 'C', 'What if your little brother or sister wants to play with your blocks?', ['What if you were building something special?', 'What if they knocked your tower down last time?', 'What if they started to cry when you said no?']],
    ['E', 'M', 'What if you see a kid sitting all alone at snack time?', ['What if you were sitting with your best friend?', "What if the kid didn't talk very much?", "What if your friends didn't want them to sit with you?"]],
    ['E', 'W', 'What if you break a crayon that belongs to your friend?', ['What if it was their favorite color?', 'What if your friend did not see it happen?', 'What if your friend got really upset?']],
    ['E', 'C', 'What if it\'s your turn on the swing but another kid is still on it?', ['What if the other kid was smaller than you?', "What if they said they weren't done yet?", 'What if recess was almost over?']],
    ['E', 'M', 'What if a grown-up says it\'s time to clean up, but you\'re still playing?', ['What if you were almost done with your game?', 'What if your friend kept playing?', 'What if you were the one who made the biggest mess?']],
    ['M', 'B', 'What if you feel really angry because you can\'t have a treat?', ['What if your friend got a treat?', 'What if you were so angry you wanted to yell?', 'What if you had been waiting all day for it?']],
    ['M', 'W', 'What if you feel shy when you meet someone new?', ['What if they smiled at you first?', 'What if they asked you to play?', 'What if everyone was looking at you?']],
    ['M', 'B', 'What if you miss your grown-up while you\'re at school?', ['What if you had a picture of them with you?', 'What if you missed them all morning?', 'What if the other kids were having fun and you still felt sad?']],
    ['M', 'C', 'What if you feel so excited that you can\'t sit still?', ['What if you were excited for your birthday?', 'What if you had to sit still in the car for a long time?', 'What if your wiggles were bothering someone next to you?']],
    ['M', 'W', 'What if a loud noise makes you feel scared?', ['What if it was thunder?', 'What if nobody else seemed scared?', "What if the noise kept happening and you didn't know what it was?"]],
    ['M', 'M', 'What if you feel sad because your ice cream fell on the ground?', ['What if it was your very first scoop?', 'What if your friend still had their ice cream?', "What if there wasn't any more ice cream?"]],
    ['M', 'B', 'What if you feel frustrated because your puzzle is too hard?', ['What if you only had two pieces left?', 'What if your friend finished their puzzle fast?', 'What if you had tried over and over?']],
    ['M', 'C', 'What if you feel left out because your friends are playing without you?', ['What if they just forgot to ask you?', 'What if they said the game was full?', 'What if it was your best friend leaving you out?']],
    ['F', 'B', 'What if your teddy bear could talk for one day?', ['What if it could only whisper?', 'What if it told you a secret?', 'What if it wanted to go on an adventure without you?']],
    ['F', 'C', 'What if you could fly like a bird?', ['What if you could only fly a little bit off the ground?', 'What if your friend could not fly?', 'What if you got lost up in the clouds?']],
    ['F', 'M', 'What if you found a dragon egg in your backyard?', ['What if the egg started to wiggle?', 'What if the baby dragon was very hungry?', 'What if the dragon grew bigger than your house?']],
    ['F', 'B', 'What if you could shrink as small as an ant?', ['What if you could ride on a ladybug?', 'What if you got stuck under the couch?', 'What if nobody could see or hear you?']],
    ['F', 'W', 'What if your shoes could make you jump super high?', ['What if you could jump over a tree?', "What if the shoes wouldn't stop bouncing?", 'What if a friend wanted to try your shoes?']],
    ['F', 'M', 'What if it rained jelly beans instead of water?', ['What if they were all your favorite flavor?', 'What if the jelly beans made a big sticky mess?', "What if there wasn't any water to drink?"]],
    ['F', 'C', 'What if you could talk to animals?', ['What if a puppy wanted to be your friend?', 'What if an animal told you it was lost?', 'What if two animals asked you to settle an argument?']],
    ['F', 'B', 'What if your bed could take you anywhere you wanted?', ['What if you could visit the moon?', 'What if you had to be back before morning?', 'What if your bed took you somewhere you didn\'t know?']],
    ['S', 'C', 'What if you don\'t know where to hang your coat on the first day of school?', ['What if there was a kid next to you?', 'What if the teacher was busy?', 'What if all the hooks were already full?']],
    ['S', 'W', 'What if your teacher asks a question and you know the answer?', ['What if lots of kids were raising their hands?', 'What if you felt too shy to say it?', "What if you weren't totally sure you were right?"]],
    ['S', 'M', 'What if you spill paint on your picture at school?', ['What if it was just a small drop?', 'What if your picture was almost finished?', 'What if it was a present for someone special?']],
    ['S', 'C', 'What if you need to go to the bathroom during story time?', ['What if the story was at the best part?', 'What if the teacher was reading out loud?', 'What if you really, really needed to go?']],
    ['S', 'W', 'What if you can\'t open your lunch box at school?', ['What if a friend was sitting next to you?', 'What if everyone else was already eating?', 'What if you felt embarrassed to ask?']],
    ['S', 'M', 'What if a new kid joins your class?', ['What if they were sitting all by themselves?', 'What if they spoke a different language?', "What if they didn't want to play at first?"]],
    ['R', 'B', 'What if you get to sleep in a big-kid bed for the first time?', ['What if your bed was right next to your sibling\'s?', 'What if it felt too big and empty?', 'What if you woke up in the night and forgot where you were?']],
    ['R', 'M', 'What if you lose your first tooth?', ['What if it fell out while you were eating?', "What if you couldn't find the tooth?", 'What if your friend lost a tooth before you?']],
    ['R', 'C', 'What if you learn to ride a bike without training wheels?', ['What if a grown-up held on at first?', 'What if you fell down the first time?', 'What if your little cousin could already do it?']],
    ['R', 'W', 'What if it\'s your first time going to the dentist?', ['What if the dentist let you wear cool sunglasses?', 'What if the chair moved up and down?', 'What if you felt really nervous?']],
    ['R', 'B', 'What if you get to be the big helper with a new baby in the family?', ['What if the baby smiled at you?', 'What if the baby cried a lot?', 'What if the grown-ups were too busy to play with you?']],
    ['T', 'C', 'What if you go on a long car ride and get bored?', ['What if you could look out the window?', 'What if there were no games to play?', 'What if the ride took all day?']],
    ['T', 'W', 'What if you get to ride on an airplane?', ['What if you sat by the window?', 'What if your ears felt funny?', 'What if the airplane bumped up and down?']],
    ['T', 'C', 'What if you go to the beach for the very first time?', ['What if you found a seashell?', 'What if a big wave splashed you?', 'What if the sand was too hot to walk on?']],
    ['T', 'W', 'What if you get lost for a minute at the store?', ['What if you could see your grown-up\'s coat?', 'What if the store was very big?', 'What if a stranger asked if you needed help?']],
    ['T', 'C', 'What if you stay at your grandparents\' house for a sleepover?', ['What if they made your favorite dinner?', 'What if the house sounded different at night?', 'What if you missed your own bed?']],
    ['H', 'M', 'What if your friend makes a silly face at you during dinner?', ['What if it made you laugh really hard?', 'What if a grown-up asked you to stop being silly?', 'What if you laughed so hard you spilled your milk?']],
    ['H', 'W', 'What if someone laughs at your drawing?', ['What if they were laughing because it was funny on purpose?', 'What if they said it looked silly?', 'What if you worked really hard on it?']],
    ['H', 'C', 'What if you tell a joke and nobody laughs?', ['What if one person smiled?', 'What if you thought it was the funniest joke ever?', 'What if someone said it was a dumb joke?']],
    ['H', 'B', 'What if your friend wants to play pretend but you want to play tag?', ['What if you could play both games?', 'What if your friend got upset?', 'What if there was only time for one game?']],
    ['H', 'M', 'What if two of your friends both want you to play with them?', ['What if they were playing the same game?', 'What if you could only play with one?', 'What if one friend said they would not be your friend anymore?']],
    ['E', 'C', 'What if you see someone drop their mitten on the sidewalk?', ['What if they were walking fast?', 'What if it was a cold day?', 'What if they were already far away?']],
    ['M', 'B', 'What if you have a bad dream and wake up?', ['What if your nightlight was on?', 'What if you could not fall back asleep?', 'What if everyone in the house was sleeping?']],
  ],
  '6-8': [
    ['E', 'C', 'What if you find a dollar on the floor at school?', ['What if no one was around?', 'What if you saw who dropped it?', 'What if it was twenty dollars instead?']],
    ['E', 'M', 'What if your friend shows you a toy they took from a store without paying?', ['What if it was just a small toy?', 'What if your friend asked you to keep it a secret?', 'What if your friend said everybody does it?']],
    ['E', 'W', 'What if you see a classmate copying your answers?', ['What if they were your good friend?', 'What if they were having a really hard day?', 'What if the teacher thought you copied them?']],
    ['E', 'C', 'What if you promised to play with one friend, but another friend invites you to something more fun?', ['What if the first friend wouldn\'t find out?', 'What if the fun thing only happened once?', 'What if the first friend had been looking forward to it all week?']],
    ['E', 'M', 'What if you accidentally hurt someone\'s feelings?', ['What if you were only joking?', "What if they didn't say anything, but looked sad?", 'What if other kids laughed at what you said?']],
    ['E', 'W', 'What if the cashier gives you too much change?', ['What if it was only a few cents?', 'What if the line was long and the cashier was busy?', 'What if you really wanted to buy something else with it?']],
    ['E', 'B', 'What if you break a rule and nobody sees?', ['What if it was a small rule?', 'What if someone else got blamed for it?', 'What if you felt bad about it at bedtime?']],
    ['E', 'C', 'What if your team wins a game but the other team played unfairly?', ['What if it was just a practice game?', 'What if your coach did not notice?', 'What if winning meant your team got a trophy?']],
    ['M', 'B', 'What if you feel jealous of your friend\'s new bike?', ['What if your friend let you ride it?', 'What if your friend kept bragging about it?', "What if you knew you couldn't get one for a long time?"]],
    ['M', 'W', 'What if you feel nervous about a doctor\'s appointment?', ['What if it was just a checkup?', 'What if you needed to get a shot?', "What if you didn't know what was going to happen?"]],
    ['M', 'M', 'What if you feel disappointed because a fun plan got canceled?', ['What if it got moved to another day?', 'What if you had been excited for weeks?', 'What if it got canceled because of something your sibling did?']],
    ['M', 'B', 'What if you feel worried about something you can\'t stop thinking about?', ['What if it was something small?', 'What if it kept you awake at night?', "What if you didn't want to tell anyone about it?"]],
    ['M', 'C', 'What if you feel proud of something but no one notices?', ['What if it was a drawing you made?', 'What if you worked on it for a long time?', 'What if someone else got praised for something similar?']],
    ['M', 'W', 'What if you feel embarrassed because you tripped in front of your class?', ['What if nobody laughed?', 'What if a few kids laughed?', 'What if people kept talking about it the next day?']],
    ['M', 'M', 'What if your pet is sick and you feel sad?', ['What if the vet said your pet would feel better soon?', 'What if your pet had to stay at the vet overnight?', "What if you were worried it was your fault?"]],
    ['F', 'B', 'What if you could have any superpower for one day?', ['What if you could only use it to help others?', 'What if your best friend got the same power?', 'What if you had to keep it a secret?']],
    ['F', 'C', 'What if you discovered a secret door in your house?', ['What if it led to a room full of toys?', 'What if it led to another world?', 'What if you could only go through it once?']],
    ['F', 'M', 'What if you could invent a brand-new food?', ['What if it had to be healthy?', 'What if nobody else liked it?', 'What if it became famous all over the world?']],
    ['F', 'W', 'What if you woke up and could understand what your pet was thinking?', ['What if your pet was thinking about snacks?', 'What if your pet was worried about something?', 'What if your pet had a secret about your family?']],
    ['F', 'C', 'What if you were in charge of your town for a day?', ['What if you could make one new rule?', 'What if the grown-ups did not like your rule?', 'What if you had to fix a big problem?']],
    ['F', 'B', 'What if you could visit any time in history?', ['What if you could go back to see dinosaurs?', "What if you couldn't speak the language there?", 'What if you could only bring one thing with you?']],
    ['F', 'M', 'What if animals could go to school with kids?', ['What if your class got a pet giraffe?', 'What if the animals were better at math than you?', 'What if one animal kept getting in trouble?']],
    ['F', 'W', 'What if you built a robot that does chores?', ['What if it could only do one chore?', 'What if the robot started doing your homework?', 'What if the robot broke something?']],
    ['S', 'C', 'What if you forget your homework at home?', ['What if it was due today?', 'What if you worked really hard on it?', 'What if the teacher thought you didn\'t do it?']],
    ['S', 'W', 'What if you don\'t understand what your teacher is explaining?', ['What if other kids seemed to understand?', 'What if you already asked once?', 'What if there was a test tomorrow?']],
    ['S', 'M', 'What if you get picked last for a team in gym class?', ['What if it was just a quick game?', 'What if your friend was a captain and did not pick you?', 'What if it happened every time?']],
    ['S', 'C', 'What if you have to give a talk in front of your class?', ['What if you could bring something to show?', 'What if you forgot what you wanted to say?', 'What if a few kids were whispering while you talked?']],
    ['S', 'W', 'What if your group partner isn\'t doing their share of the work?', ['What if they said they would do it later?', 'What if the project was due tomorrow?', 'What if they were your friend?']],
    ['S', 'M', 'What if you get a lower grade than you expected?', ['What if you studied really hard?', 'What if your friend got a better grade?', 'What if you had to show it to your grown-up?']],
    ['R', 'B', 'What if you\'re invited to your first sleepover at a friend\'s house?', ['What if you knew the friend\'s family well?', 'What if you felt homesick in the middle of the night?', 'What if the other kids wanted to stay up really late?']],
    ['R', 'C', 'What if you get to walk to a friend\'s house by yourself for the first time?', ['What if it was just down the street?', 'What if you got a little lost?', 'What if a friend dared you to take a shortcut?']],
    ['R', 'M', 'What if you\'re given your first chore that\'s all yours?', ['What if it was feeding the pet?', 'What if you forgot to do it one day?', 'What if your sibling got an easier chore?']],
    ['R', 'W', 'What if you get your very first allowance?', ['What if it was just a little money?', 'What if you saw something you wanted right away?', 'What if your friend got a lot more allowance than you?']],
    ['R', 'B', 'What if you\'re old enough to stay up a little later than before?', ['What if it was only on weekends?', 'What if you felt tired the next day?', 'What if your younger sibling was upset they had to go to bed?']],
    ['T', 'C', 'What if your family goes camping and it starts to rain?', ['What if the tent stayed dry?', 'What if the campfire went out?', 'What if it rained the whole weekend?']],
    ['T', 'W', 'What if your flight is delayed and you have to wait at the airport?', ['What if there was a play area?', 'What if you had to wait for hours?', 'What if you were going to miss something fun?']],
    ['T', 'C', 'What if you visit a place where people speak a different language?', ['What if someone smiled and waved at you?', 'What if you needed to ask for directions?', 'What if you wanted to make friends with a kid there?']],
    ['T', 'M', 'What if you try a food you\'ve never eaten before on a trip?', ['What if it smelled really good?', 'What if it looked strange?', 'What if the family who made it was watching you take a bite?']],
    ['T', 'W', 'What if you lose your favorite toy while traveling?', ['What if you might find it at the hotel?', 'What if you left it on the airplane?', 'What if it was a gift from someone special?']],
    ['H', 'M', 'What if your friends are laughing at a joke you don\'t get?', ['What if they explained it to you?', 'What if you pretended to get it?', 'What if they laughed at you for not getting it?']],
    ['H', 'W', 'What if someone gives you a nickname you don\'t like?', ['What if they meant it to be friendly?', 'What if other kids started using it too?', 'What if it was your friend who started it?']],
    ['H', 'C', 'What if your friend plays a prank that goes too far?', ['What if nobody got hurt?', 'What if someone started to cry?', 'What if your friend wanted you to help with the next prank?']],
    ['H', 'B', 'What if two of your friends get into an argument?', ['What if it was about something small?', 'What if both friends wanted you on their side?', 'What if they stopped talking to each other?']],
    ['H', 'M', 'What if you want to join a game but the other kids already started?', ['What if one kid waved at you?', 'What if the teams were already even?', 'What if they said, "Maybe next time"?']],
    ['E', 'C', 'What if you see a younger kid struggling to carry something heavy?', ['What if you were in a hurry?', "What if the kid didn't ask for help?", 'What if your friends were waiting for you?']],
    ['M', 'B', 'What if you feel lonely after your best friend moves away?', ['What if you could video chat with them?', 'What if you saw their empty house every day?', 'What if they made a new best friend?']],
    ['S', 'W', 'What if you find out there\'s a substitute teacher today?', ['What if the substitute was really nice?', 'What if kids in your class started acting silly?', 'What if the substitute asked you to help?']],
  ],
  '9-12': [
    ['E', 'C', 'What if your friend asks to copy your homework?', ['What if it was just one question?', 'What if your friend was having a hard week at home?', 'What if you would both get in trouble if the teacher noticed?']],
    ['E', 'M', 'What if you find out a classmate is spreading a rumor?', ['What if the rumor was about someone you barely know?', 'What if the rumor was about your friend?', 'What if your friends believed the rumor?']],
    ['E', 'W', 'What if you break something at a friend\'s house and no one sees?', ['What if it was something small?', "What if it was your friend's parent's favorite thing?", 'What if your friend got blamed for it?']],
    ['E', 'C', 'What if you see someone leave their phone on a bench?', ['What if you saw which way they went?', 'What if the phone started ringing?', 'What if your friend said you should keep it?']],
    ['E', 'M', 'What if your friend tells you a secret that worries you?', ['What if they made you promise not to tell?', 'What if the secret was about someone getting hurt?', 'What if telling meant your friend might get mad at you?']],
    ['E', 'W', 'What if you could win a game by bending the rules a little?', ['What if nobody would notice?', 'What if the other team was bending the rules too?', 'What if winning meant your team would go to the finals?']],
    ['E', 'B', 'What if you said something unkind about someone and they found out?', ['What if you didn\'t really mean it?', 'What if they heard it from someone else?', 'What if they stopped talking to you?']],
    ['E', 'C', 'What if your group wants to leave someone out of a project?', ['What if that person was a little annoying?', 'What if the person did not know they were being left out?', 'What if your group said you could leave too if you didn\'t like it?']],
    ['M', 'B', 'What if you feel stressed because you have too much to do?', ['What if it was only for this week?', 'What if you also had a big game this weekend?', "What if you didn't know which thing to do first?"]],
    ['M', 'W', 'What if you feel nervous before a big performance?', ['What if you had practiced a lot?', 'What if your whole family was coming to watch?', 'What if you made a mistake in the middle?']],
    ['M', 'M', 'What if you feel hurt because a friend didn\'t invite you to their party?', ['What if they could only invite a few people?', 'What if everyone else at your table was invited?', 'What if they posted pictures of the party online?']],
    ['M', 'B', 'What if you feel angry at a sibling and want to get back at them?', ['What if they took something without asking?', 'What if they keep doing it again and again?', 'What if your parents took their side?']],
    ['M', 'C', 'What if you feel like you\'re not good at anything?', ['What if a friend told you something you\'re good at?', 'What if you just lost a game or a contest?', 'What if you compared yourself to someone who seemed great at everything?']],
    ['M', 'W', 'What if you feel anxious about starting at a new school?', ['What if you got to visit the school first?', "What if you didn't know anyone there?", 'What if the kids there already had their own friend groups?']],
    ['M', 'M', 'What if you feel guilty about something you did?', ['What if it was a small thing?', 'What if no one else knew about it?', 'What if making it right meant admitting it to someone you respect?']],
    ['F', 'B', 'What if you could design your own theme park?', ['What if you had a small budget?', 'What if it had to be fun for every age?', 'What if one ride turned out to be too scary?']],
    ['F', 'C', 'What if you could swap lives with someone for a day?', ['What if it was a friend?', 'What if it was someone famous?', 'What if you couldn\'t switch back until they agreed?']],
    ['F', 'M', 'What if you discovered a new planet?', ['What if you got to name it?', 'What if it already had living things on it?', 'What if people wanted to move there and change it?']],
    ['F', 'W', 'What if you could make one invention that helps your family?', ['What if it could be anything at all?', 'What if it only helped one person in your family?', 'What if your invention caused a new problem?']],
    ['F', 'C', 'What if you could talk to your future self?', ['What if you could ask one question?', 'What if your future self gave you advice you did not like?', 'What if your future self asked you to change something?']],
    ['F', 'B', 'What if you woke up in a video game world?', ['What if you got to pick the game?', 'What if you only had three lives?', 'What if you had to work with a character you did not like?']],
    ['F', 'M', 'What if you were in charge of making a new holiday?', ['What if it had to celebrate something about your family?', 'What if it needed its own special food?', 'What if some people did not want to celebrate it?']],
    ['F', 'W', 'What if you could have a conversation with any animal?', ['What if you picked a dolphin?', 'What if the animal asked you for help?', 'What if what it told you changed how you think about people?']],
    ['S', 'C', 'What if you forget to study for a test until the night before?', ['What if it was a short quiz?', 'What if you also had practice that night?', 'What if a friend offered you the answers?']],
    ['S', 'W', 'What if you disagree with a grade a teacher gave you?', ['What if it was only off by a little?', 'What if you were sure you were right?', 'What if the teacher seemed annoyed when you asked?']],
    ['S', 'M', 'What if you want to run for class president?', ['What if your best friend was running too?', 'What if you had to give a speech?', 'What if people made fun of your ideas?']],
    ['S', 'C', 'What if you\'re working on a group project and you have a better idea than everyone else?', ['What if they listened to you?', 'What if the group already started on another idea?', 'What if the group leader didn\'t like your idea?']],
    ['S', 'W', 'What if you notice a classmate is always alone at lunch?', ['What if they seemed happy reading a book?', 'What if your friends did not want them to join?', 'What if other kids started to tease them?']],
    ['S', 'M', 'What if you\'re asked to help a classmate who\'s struggling?', ['What if they were thankful?', 'What if it took up your free time?', "What if they didn't want help from you?"]],
    ['R', 'B', 'What if you\'re allowed to stay home alone for the first time?', ['What if it was just for an hour?', 'What if someone knocked on the door?', 'What if something broke while you were home?']],
    ['R', 'C', 'What if you get your first phone?', ['What if it came with family rules?', 'What if your friends were in a group chat you were not in?', 'What if you saw something online that made you uncomfortable?']],
    ['R', 'M', 'What if you start getting a bigger say in family decisions?', ['What if you got to plan a family dinner?', 'What if you disagreed with what everyone else wanted?', 'What if your choice did not go well?']],
    ['R', 'W', 'What if you go to your first overnight camp?', ['What if a friend went with you?', 'What if you felt homesick?', 'What if your cabin mates were mean to someone?']],
    ['R', 'B', 'What if you\'re given responsibility for babysitting a younger sibling?', ['What if it was just for a short time?', "What if they wouldn't listen to you?", 'What if something went wrong?']],
    ['T', 'C', 'What if your family takes a road trip and the car breaks down?', ['What if you were close to a town?', 'What if it happened in the middle of nowhere?', 'What if everyone in the car was getting grumpy?']],
    ['T', 'W', 'What if you get separated from your family at a theme park?', ['What if you had a plan for this?', "What if your phone's battery was dead?", 'What if a stranger offered to help you find them?']],
    ['T', 'C', 'What if you visit a country where the customs are very different from yours?', ['What if people greeted each other differently?', 'What if you accidentally did something rude there?', 'What if a custom there felt unfair to you?']],
    ['T', 'M', 'What if you go on a hike and it\'s harder than you expected?', ['What if the view at the top was amazing?', 'What if you were the slowest one in the group?', 'What if the group wanted to keep going but you were exhausted?']],
    ['T', 'W', 'What if you have to share a hotel room with your whole family?', ['What if it was only for one night?', 'What if someone snored really loudly?', 'What if everyone wanted to do different things?']],
    ['H', 'M', 'What if a joke you made in a group chat gets taken the wrong way?', ['What if only one person was upset?', 'What if people started screenshotting it?', 'What if the person who got upset was your friend?']],
    ['H', 'W', 'What if your friends start teasing someone and expect you to join in?', ['What if it seemed like harmless fun?', 'What if the person being teased looked upset?', 'What if your friends teased you for not joining in?']],
    ['H', 'C', 'What if you want to sit with a different group at lunch?', ['What if someone in that group invited you?', 'What if your usual friends felt hurt?', 'What if the new group was considered "cooler"?']],
    ['H', 'B', 'What if someone posts an embarrassing photo of you?', ['What if it was kind of funny?', 'What if lots of people commented on it?', 'What if it was your friend who posted it?']],
    ['H', 'M', 'What if your friend group splits into two sides?', ['What if both sides were nice to you?', 'What if each side wanted you to pick them?', 'What if staying friends with both meant both sides got mad?']],
    ['E', 'C', 'What if you find out your friend lied to you?', ['What if it was a small lie?', 'What if they lied to protect your feelings?', 'What if they lied to other people about you too?']],
    ['M', 'B', 'What if you feel like your parents don\'t understand you?', ['What if they were trying their best?', 'What if they were busy with work?', 'What if you were afraid that talking would start an argument?']],
    ['S', 'W', 'What if you get a really good grade and a friend gets a bad one?', ['What if your friend congratulated you?', 'What if your friend asked how you did it?', 'What if your friend seemed jealous?']],
  ],
  '13-15': [
    ['E', 'C', 'What if your friend asks you to cover for them with their parents?', ['What if it was for something harmless?', 'What if their parents called you to check?', "What if you didn't know where your friend actually was?"]],
    ['E', 'M', 'What if you see someone being excluded in your group chat?', ['What if it was just one message?', 'What if it kept happening every day?', 'What if the person who started it was really popular?']],
    ['E', 'W', 'What if a classmate offers to sell you answers to a test?', ['What if it was for a class you were struggling in?', 'What if lots of people were buying them?', 'What if the teacher asked if you knew anything about it?']],
    ['E', 'C', 'What if you overhear someone planning to embarrass a classmate?', ['What if it was meant as a joke?', "What if the classmate was someone you didn't really like?", 'What if stopping it meant the group might turn on you?']],
    ['E', 'M', 'What if your boss at a part-time job asks you to do something that feels unfair?', ['What if it was a small thing?', 'What if you really needed the money?', 'What if other coworkers were going along with it?']],
    ['E', 'W', 'What if you find a wallet with cash and an ID inside?', ['What if the address was close by?', 'What if there was a lot of cash?', 'What if no one would ever know if you kept the cash?']],
    ['E', 'B', 'What if you realize you treated someone unfairly a while ago?', ['What if they seemed to have forgotten about it?', 'What if you haven\'t talked to them in a long time?', 'What if apologizing felt really awkward?']],
    ['E', 'C', 'What if a friend shares something online that isn\'t true?', ['What if they didn\'t know it was false?', 'What if a lot of people were sharing it?', 'What if correcting them meant calling them out in front of others?']],
    ['M', 'B', 'What if you feel overwhelmed by everything you\'re expected to do?', ['What if it was just a busy week?', 'What if you had a big test and a game on the same day?', "What if you didn't want to let anyone down?"]],
    ['M', 'W', 'What if you feel like you don\'t fit in anywhere?', ['What if one person made you feel welcome?', 'What if you joined a new club or team?', "What if you felt like you had to change who you are to fit in?"]],
    ['M', 'M', 'What if you feel jealous of how a friend\'s life looks online?', ['What if you knew it was only the highlights?', 'What if they seemed happier than you?', 'What if you started posting things just to compete?']],
    ['M', 'B', 'What if you can\'t stop thinking about a mistake you made?', ['What if it was a small mistake?', 'What if other people still brought it up?', 'What if it kept you up at night?']],
    ['M', 'C', 'What if you feel angry and say something you regret?', ['What if the other person forgave you right away?', 'What if they were still upset days later?', 'What if what you said was partly true?']],
    ['M', 'W', 'What if you feel nervous about trying out for a team?', ['What if your friends were trying out too?', 'What if you didn\'t make it last year?', 'What if you made the team but your best friend didn\'t?']],
    ['M', 'M', 'What if you feel disappointed in yourself after a bad grade?', ['What if it was only one assignment?', 'What if you had studied a lot?', 'What if you felt like you had let your family down?']],
    ['F', 'B', 'What if you could start a business doing anything you love?', ['What if it was something you do for fun already?', 'What if it took up all your free time?', 'What if a friend wanted to be your partner?']],
    ['F', 'C', 'What if you could solve one big problem in the world?', ['What if you could pick any problem?', 'What if solving it created a new problem?', 'What if people disagreed about whether it was a problem?']],
    ['F', 'M', 'What if you could live in any city in the world for a year?', ['What if you could bring one person with you?', "What if you didn't speak the language?", 'What if you liked it so much you didn\'t want to come back?']],
    ['F', 'W', 'What if you were famous for one day?', ['What if you could pick what you were famous for?', 'What if people followed you everywhere?', 'What if someone posted something untrue about you?']],
    ['F', 'C', 'What if you could have dinner with anyone from history?', ['What if you could ask them anything?', 'What if they had ideas you disagreed with?', 'What if they asked you about the world today?']],
    ['F', 'B', 'What if you found out you could read people\'s minds?', ['What if you could turn it off?', 'What if you heard something about yourself?', 'What if you learned a secret that could help someone?']],
    ['F', 'M', 'What if you could redesign your school from scratch?', ['What if you could change the schedule?', 'What if everyone had different ideas?', 'What if your ideas cost too much?']],
    ['F', 'W', 'What if you got to make a movie about your life?', ['What if you could choose who plays you?', 'What if it had to include a hard moment?', 'What if your family saw how you portrayed them?']],
    ['S', 'C', 'What if you\'re falling behind in a class and don\'t want anyone to know?', ['What if there was free tutoring?', 'What if your friends found out?', 'What if your grade affected whether you could play sports?']],
    ['S', 'W', 'What if a teacher treats you unfairly?', ['What if it only happened once?', 'What if other students noticed it too?', 'What if speaking up might make things worse?']],
    ['S', 'M', 'What if you have to choose between two activities you love?', ['What if you could try both for a while?', 'What if your friends were all in one of them?', 'What if your parents wanted you to choose the other one?']],
    ['S', 'C', 'What if you\'re picked to lead a group project with people you don\'t know?', ['What if they were easy to work with?', 'What if someone didn\'t do their part?', 'What if the group disagreed with your decisions?']],
    ['S', 'W', 'What if you see someone using AI to do all of their homework?', ['What if it was just for a small assignment?', 'What if they were getting better grades than you?', 'What if they offered to show you how?']],
    ['S', 'M', 'What if you want to switch to a harder class?', ['What if your teacher thought you were ready?', 'What if it meant less free time?', 'What if your friends said you were showing off?']],
    ['R', 'B', 'What if you get your first job?', ['What if it was babysitting or yard work?', 'What if it made you miss time with friends?', 'What if you made a mistake on your first day?']],
    ['R', 'C', 'What if you\'re allowed to go to the mall with friends without an adult?', ['What if you had a set time to be home?', 'What if your friends wanted to go somewhere you were not allowed?', 'What if you lost track of time?']],
    ['R', 'M', 'What if you start making your own decisions about how to spend your money?', ['What if you were saving for something big?', 'What if your friends always wanted to spend money when you hung out?', 'What if you spent it all and then needed it?']],
    ['R', 'W', 'What if you start thinking about what you want to do when you grow up?', ['What if you already had an idea?', 'What if your family hoped you would choose something else?', "What if you had no idea and everyone else seemed to know?"]],
    ['R', 'B', 'What if you\'re asked to volunteer in your community?', ['What if you could choose where?', 'What if it was hard work?', 'What if it took time away from something you love?']],
    ['T', 'C', 'What if you plan a day trip with your family?', ['What if you got to choose where to go?', 'What if something went wrong with your plans?', 'What if someone in your family really didn\'t want to go?']],
    ['T', 'W', 'What if you travel with a school group to another city?', ['What if you got to room with your friends?', 'What if you got separated from the group?', 'What if someone wanted to break the trip rules?']],
    ['T', 'C', 'What if you meet someone your age from another country?', ['What if you had a lot in common?', 'What if they had very different opinions?', 'What if they asked you about something you had never thought about?']],
    ['T', 'M', 'What if you go somewhere without your phone for a whole week?', ['What if it was a camping trip?', 'What if your friends were making plans without you?', 'What if you actually liked it better?']],
    ['T', 'W', 'What if your family is thinking about moving to a new town?', ['What if it was close by?', 'What if you had to change schools?', 'What if you got to help decide?']],
    ['H', 'M', 'What if your friends make fun of something you like?', ['What if they were just joking around?', 'What if it was something really important to you?', 'What if you started hiding the things you like?']],
    ['H', 'W', 'What if a group chat turns into people making fun of someone?', ['What if it was just one message?', 'What if the person was in the chat?', 'What if leaving the chat made people talk about you?']],
    ['H', 'C', 'What if someone you like doesn\'t seem interested in being friends?', ['What if they were just shy?', 'What if they were friendly to everyone else?', 'What if your friends noticed and teased you about it?']],
    ['H', 'B', 'What if your friend starts hanging out with a new group?', ['What if they still invited you sometimes?', 'What if the new group did things you did not like?', 'What if your friend started acting differently?']],
    ['H', 'M', 'What if you\'re asked to keep a group secret that makes you uncomfortable?', ['What if it was harmless?', 'What if it could hurt someone?', 'What if telling meant losing the group?']],
    ['E', 'C', 'What if you notice a younger kid being picked on by kids your age?', ['What if you didn\'t know the younger kid?', 'What if the kids picking on them were your friends?', 'What if stepping in meant you might become a target?']],
    ['M', 'B', 'What if you feel like no one listens to your opinions?', ['What if one person did listen?', 'What if it was your own family?', 'What if you stopped sharing your opinions at all?']],
    ['S', 'W', 'What if you get credit for an idea that was really your friend\'s?', ['What if your friend didn\'t mind?', 'What if the teacher praised you in front of everyone?', 'What if your friend was upset but didn\'t say anything?']],
  ],
};

export const migration_0013_more_placeholder_prompts = {
  name: '0013_more_placeholder_prompts',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    for (const c of NEW_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, display_order, icon, is_placeholder) VALUES (?, ?, ?, ?, 1)',
        c.id,
        c.name,
        c.order,
        c.icon,
      );
    }

    const now = new Date().toISOString();
    for (const [ageGroup, rows] of Object.entries(PROMPTS)) {
      // The existing placeholders are numbered 001–003 in each age group.
      for (let i = 0; i < rows.length; i++) {
        const [cat, situations, text, twists] = rows[i];
        const id = `ph-${ageGroup}-${String(i + 4).padStart(3, '0')}`;
        await db.runAsync(
          `INSERT OR IGNORE INTO prompts
           (id, age_group, category_id, text, tier, source, parent_askable, is_active, is_placeholder, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'free', 'official', 1, 1, 1, ?, ?)`,
          id,
          ageGroup,
          CATEGORY[cat],
          text,
          now,
          now,
        );
        for (const s of situations) {
          await db.runAsync(
            'INSERT OR IGNORE INTO prompt_liminal_spaces (prompt_id, liminal_space_id) VALUES (?, ?)',
            id,
            SITUATION[s],
          );
        }
        for (let d = 0; d < twists.length; d++) {
          const difficulty = d + 1;
          await db.runAsync(
            `INSERT OR IGNORE INTO world_building (id, prompt_id, card_text, display_order, difficulty, is_placeholder)
             VALUES (?, ?, ?, ?, ?, 1)`,
            `${id}-tw-${difficulty}`,
            id,
            twists[d],
            difficulty,
            difficulty,
          );
        }
      }
    }
  },
};
