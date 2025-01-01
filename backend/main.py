import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()


conversation_chain = None
chat_history = []

def get_pdf_text(pdf_files):
    text = []
    metadata = []
    for pdf_file in pdf_files:
        pdf_reader = PdfReader(pdf_file.file)
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            page_text = page.extract_text()
            if page_text.strip():
                text.append(page_text)
                metadata.append({"page": page_num})
    return text, metadata

def get_text_chunks(texts, metadatas):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = []
    chunk_metadatas = []
    for i, text in enumerate(texts):
        split_chunks = text_splitter.split_text(text)
        chunks.extend(split_chunks)
        chunk_metadatas.extend([metadatas[i]] * len(split_chunks))
    return chunks, chunk_metadatas


def get_vectorstore(text_chunks, metadata_chunks):
    embeddings = HuggingFaceEmbeddings()
    vectorstore = FAISS.from_texts(
        texts=text_chunks,
        embedding=embeddings,
        metadatas=metadata_chunks
    )
    return vectorstore


def create_conversation_chain(vectorstore):
    llm = Ollama(model="llama3")
    # memory = ConversationBufferMemory(
    #     memory_key='chat_history', output_key='answer', return_messages=True)
    conversation_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        return_source_documents=True,
        # memory=memory
    )
    return conversation_chain



@app.post("/process_pdfs/")
async def process_pdfs(files: list[UploadFile] = File(...)):
    try:
        raw_text, metadata = get_pdf_text(files)
        text_chunks, metadata_chunks = get_text_chunks(raw_text, metadata)
        vectorstore = get_vectorstore(text_chunks, metadata_chunks)

        global conversation_chain
        conversation_chain = create_conversation_chain(vectorstore)
        return {"message": "PDFs processed successfully."}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/ask_question/")
async def ask_question(question: str = Form(...)):
    try:
        if not conversation_chain:
            return JSONResponse(content={"error": "No conversation chain initialized. Please process PDFs first."}, status_code=400)

        response = conversation_chain({'query': question})
        print("Response from conversation chain:", response) 

        answer = response.get('result', 'No result key found')
        sources = response.get('source_documents', [])
        citations = [{"page": source.metadata.get("page", "Unknown"), "content": source.page_content} for source in sources]

        chat_history.extend([HumanMessage(content=question), answer])
        return {"response": answer, "citations": citations}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)



@app.get("/chat_history/")
async def get_chat_history():
    if chat_history:
        return {"chat_history": chat_history}
    return {"chat_history": []}