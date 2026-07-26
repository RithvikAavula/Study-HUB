from typing import List, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()


class ChunkMetadata:
    def __init__(self, page_number: int, chunk_index: int, text: str):
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.text = text


class DocumentChunker:
    """Splits document pages into semantic chunks with page tracking."""

    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
            length_function=len,
        )

    def chunk_pages(self, pages: List[Tuple[int, str]]) -> List[ChunkMetadata]:
        """
        Takes list of (page_number, text) and returns flat list of ChunkMetadata.
        Preserves page number for each chunk.
        """
        all_chunks: List[ChunkMetadata] = []
        global_index = 0

        for page_number, page_text in pages:
            if not page_text.strip():
                continue

            page_chunks = self.splitter.split_text(page_text)

            for chunk_text in page_chunks:
                if len(chunk_text.strip()) < 20:  # skip tiny fragments
                    continue
                all_chunks.append(
                    ChunkMetadata(
                        page_number=page_number,
                        chunk_index=global_index,
                        text=chunk_text.strip(),
                    )
                )
                global_index += 1

        logger.info(
            "Document chunked",
            total_pages=len(pages),
            total_chunks=len(all_chunks),
        )
        return all_chunks
