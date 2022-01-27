def get_dataframe_as_csv(event, steps_manager):
    """
    Sends a dataframe as a CSV string
    """
    sheet_index = event['sheet_index']
    df = steps_manager.dfs[sheet_index]

    return df.to_csv(index=False)