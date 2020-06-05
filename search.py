
import re
import pandas as pd
import nltk 
from   nltk          import pos_tag
from   nltk.tokenize import word_tokenize
from   nltk.corpus   import stopwords
from   nltk.stem     import WordNetLemmatizer
from   nltk.corpus   import wordnet as wn
from   collections   import defaultdict
from   sklearn.feature_extraction.text import TfidfVectorizer
from   sklearn.metrics.pairwise        import cosine_similarity


def WordLemmatizer(data):
    tag_map = defaultdict(lambda : wn.NOUN)
    tag_map['J'] = wn.ADJ
    tag_map['V'] = wn.VERB
    tag_map['R'] = wn.ADV
    document     = []
    lemmatizer   = WordNetLemmatizer()
    for index,entry in enumerate(data):
        sentence = []
        for word, tag in pos_tag(entry.split(" ")):
            word  = re.sub("\W+", " ", word).strip()
            if len(word)>1 and word not in stopwords.words('english') and word.isalpha():
                root = lemmatizer.lemmatize(word,tag_map[tag[0]])
                sentence.append(root)
        sentence = " ".join(sentence)
        sentence = re.sub("'",   '', sentence)
        document.append(sentence)
    return document


def SearchEngine(documents, query, theshold):
    try:
        assert len(documents) != 0
        assert all(bool(type(document) == str and len(document.strip()) != 0) for document in documents)
        assert bool(type(query) == str and len(query.strip()) != 0)
    except:
        return [0]
    query       = re.sub("\W+", " ", query).strip()
    query       = WordLemmatizer([query])
    documents   = WordLemmatizer(documents)
    vectorizer  = TfidfVectorizer()
    docs_tfidf  = vectorizer.fit_transform(documents)
    query_tfidf = vectorizer.transform(query)
    cosim       = cosine_similarity(query_tfidf, docs_tfidf).flatten()
    return [ i for (i,j) in enumerate(cosim) if j >= theshold ]