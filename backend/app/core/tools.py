from typing import Any

from langchain_core.tools import tool


@tool
def read_spreadsheet(range_address: str):
    """
    Reads values from a specific Excel range (e.g., 'A1:B10').
    """
    pass


@tool
def get_spreadsheets():
    """
    Reads values from a specific Excel range (e.g., 'A1:B10').
    """
    pass


@tool
def write_spreadsheet(range_address: str, values: list[list[Any]]):
    """
    Writes values to a specific Excel range.
    """
    pass
