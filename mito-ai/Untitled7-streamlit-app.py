import streamlit as st

st.title('Untitled7')

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
print("hello world")

# Converting Code Cell
print("hello hello ")

# Converting Code Cell
