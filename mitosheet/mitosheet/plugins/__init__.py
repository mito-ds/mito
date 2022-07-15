


from typing import Dict, List, Optional

from mitosheet.plugins.custom_plugins.delete_columns_with_a import \
    DeleteColumnsWithAPlugin
from mitosheet.plugins.custom_plugins.delete_id_column import \
    DeleteIDColumnPlugin
from mitosheet.plugins.plugin import Plugin

plugins = [
    DeleteIDColumnPlugin,
    DeleteColumnsWithAPlugin
]



def get_plugin_class_with_name(plugin_name: str) -> Optional[Plugin]:
    for plugin in plugins:
        if plugin.get_plugin_name() == plugin_name:
            return plugin
    return None    

def get_plugins_for_analysis_data() -> List[Dict[str, str]]:
    print(plugins)
    return [
        {'plugin_name': plugin.get_plugin_name()} for plugin in plugins
    ]
