# Behavioral Q1: "Describe a time you worked on a team project"

## Weak

We did a project together. It was fine. Everyone did their part. We submitted it.

## Average

In my second year, I worked with three classmates on a machine learning project. I handled the data preprocessing part. We had some communication issues but finished it on time and got a decent grade.

## Good

During my third semester at Bahria University, I was part of a four-member team building an AI-based attendance system. I took the lead on the face recognition module using OpenCV and Python. I also organized weekly meetings to track progress and resolve blockers. As a result, we delivered the project one week early and scored **89 out of 100**.

---

# Behavioral Q2: "Tell me about a challenge you faced during your studies"

## Weak

I had a hard time with some subjects. It was difficult. I studied more and passed.

## Average

In my third semester, I struggled with the Deep Learning course because the concepts were very advanced. I watched YouTube tutorials and read extra notes. Eventually, I understood it better and passed the exam.

## Good

During my third semester, I found the Deep Learning course extremely challenging — specifically understanding backpropagation and gradient descent mathematically. I created a personal study plan, watched Stanford CS231n lectures daily, and built a small neural network from scratch without using any library. By the end, I not only passed the course with a **B+** but also used that knowledge in my final year project to build a CNN classifier.

---

# Technical Q1: "What is the difference between supervised and unsupervised learning?"

## Weak

Supervised learning uses labels and unsupervised doesn't. They are both types of machine learning basically.

## Average

In supervised learning, the model is trained on labeled data where the correct answers are provided. In unsupervised learning, there are no labels and the model finds patterns on its own. Examples are classification for supervised and clustering for unsupervised.

## Good

Supervised learning trains a model on labeled input-output pairs — for example, a spam classifier trained on emails labeled as spam or not spam. The model learns a mapping function from input to output by minimizing prediction error.

Unsupervised learning has no labels — the model discovers hidden structure in data on its own, such as K-means clustering grouping customers by purchasing behavior.

The key difference is that supervised learning requires human-annotated data, which is expensive to obtain, while unsupervised learning can work on raw unlabeled data but often produces less interpretable results.

---

# Technical Q2: "Explain what overfitting is and how to prevent it"

## Weak

Overfitting is when the model is too good on training data but bad on new data. You can fix it by getting more data or something.

## Average

Overfitting happens when a model learns the training data too well, including its noise, so it performs poorly on new unseen data. You can prevent it using techniques like dropout, regularization, or by getting more training data.

## Good

Overfitting occurs when a model memorizes training data patterns, including noise, rather than learning generalizable features — resulting in high training accuracy but poor test accuracy.

For example, a decision tree with no depth limit may perfectly fit training data but fail on new samples.

Prevention techniques include:

- **L1/L2 Regularization**: Penalizes large weights to reduce model complexity.
- **Dropout**: Randomly deactivates neurons during training to prevent co-dependency.
- **Early Stopping**: Halts training when validation loss starts increasing.
- **Data Augmentation**: Artificially increases training set diversity.

In my CNN project, I used a **dropout rate of 0.5** and **early stopping**, which reduced overfitting and improved test accuracy from **71% to 84%**.