import streamlit as st

st.title('Untitled2')

def display_viz(fig):
    """Display a visualization in Streamlit based on its type."""
    
    # Check for Plotly figure
    if hasattr(fig, 'update_layout') or str(type(fig)).find('plotly') >= 0:
        st.plotly_chart(fig)
        return
    
    # Check for Matplotlib figure
    if hasattr(fig, 'add_subplot') or str(type(fig)).find('matplotlib') >= 0:
        st.pyplot(fig)
        return
    
    # Fallback - try pyplot as it's most common
    try:
        st.pyplot(fig)
    except Exception:
        st.error(f"Couldn't display visualization of type: {type(fig)}")
        st.write(fig)  # Attempt to display as generic object



# Converting Code Cell
import pandas as pd

data = {
    'animal': ['cat', 'dog'],
    'count': [7, 10]
}
cats_dogs_df = pd.DataFrame(data)
cats_dogs_df 

# Converting Code Cell
import matplotlib.pyplot as plt

plt.bar(cats_dogs_df['animal'], cats_dogs_df['count'], color=['orange', 'blue'])
plt.xlabel('Animal')
plt.ylabel('Count')
plt.title('Count of Cats and Dogs')
display_viz(plt.gcf())