import pandas as pd
import numpy as np
import os 
import re
import operator
import nltk 
from   nltk import pos_tag
from   nltk.tokenize import word_tokenize
from   nltk.corpus import stopwords
from   nltk.stem import WordNetLemmatizer
from   nltk.corpus import wordnet as wn
from   collections import defaultdict
from   sklearn.feature_extraction.text import TfidfVectorizer

def wordLemmatizer(data):
    tag_map = defaultdict(lambda : wn.NOUN)
    tag_map['J'] = wn.ADJ
    tag_map['V'] = wn.VERB
    tag_map['R'] = wn.ADV
    file_clean_k =pd.DataFrame()
    for index,entry in enumerate(data):
        
        # Declaring Empty List to store the words that follow the rules for this step
        Final_words = []
        # Initializing WordNetLemmatizer()
        word_Lemmatized = WordNetLemmatizer()
        # pos_tag function below will provide the 'tag' i.e if the word is Noun(N) or Verb(V) or something else.
        for word, tag in pos_tag(entry):
            # Below condition is to check for Stop words and consider only alphabets
            if len(word)>1 and word not in stopwords.words('english') and word.isalpha():
                word_Final = word_Lemmatized.lemmatize(word,tag_map[tag[0]])
                Final_words.append(word_Final)
            # The final processed set of words for each iteration will be stored in 'text_final'
                file_clean_k.loc[index,'Keyword_final'] = str(Final_words)
                file_clean_k.loc[index,'Keyword_final'] = str(Final_words)
                file_clean_k=file_clean_k.replace(to_replace ="\[.", value = '', regex = True)
                file_clean_k=file_clean_k.replace(to_replace ="'", value = '', regex = True)
                file_clean_k=file_clean_k.replace(to_replace =" ", value = '', regex = True)
                file_clean_k=file_clean_k.replace(to_replace ='\]', value = '', regex = True)
    return file_clean_k

class SearchEngine:
    def __init__(self, entries):
        self.entries = entries
        self.df = pd.DataFrame(
            {
                'index': [wlo['id'] for wlo in self.entries.values()],
                'notes': [wlo['notes'] for wlo in self.entries.values()]
            }
        )
        self.vocabulary = set()
        for doc in self.df.notes:
            self.vocabulary.update(doc.split(','))
        self.vocabulary = list(self.vocabulary)
        self.tfidf = TfidfVectorizer(vocabulary=self.vocabulary)
        self.tfidf.fit(self.df.notes)
        self.tfidf_tran = self.tfidf.transform(self.df.notes)
    def gen_vector_T(self, tokens):
        Q = np.zeros((len(self.vocabulary)))    
        x= self.tfidf.transform(tokens)
        for token in tokens[0].split(','):
            try:
                ind = self.vocabulary.index(token)
                Q[ind]  = x[0, self.tfidf.vocabulary_[token]]
            except:
                pass
        return Q
    def cosine_sim(self, a, b):
        cos_sim = np.dot(a, b)/(np.linalg.norm(a)*np.linalg.norm(b))
        return cos_sim
    def cosine_similarity_T(self, threshold, query):
        preprocessed_query = preprocessed_query = re.sub("\W+", " ", query).strip()
        tokens = word_tokenize(str(preprocessed_query))
        print(preprocessed_query, tokens)
        q_df = pd.DataFrame(columns=['q_clean'])
        q_df.loc[0,'q_clean'] = tokens
        q_df['q_clean'] = wordLemmatizer(q_df.q_clean)
        d_cosines = []
        print(q_df['q_clean'])
        query_vector = self.gen_vector_T(q_df['q_clean'])
        print(query_vector)
        for d in self.tfidf_tran.A:
            print(query_vector, d)
            d_cosines.append(self.cosine_sim(query_vector, d))
        print(d_cosines)                
        out = np.array(d_cosines).argsort()[:][::-1]
        d_cosines.sort()
        a = []
        for index, simScore in zip(out, d_cosines[:][::-1]):
            if simScore >= threshold:
                a.append(self.df.loc[index,'index'])
        return a