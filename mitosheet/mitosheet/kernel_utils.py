
from typing import Any, Callable


try:
    import os
    from ipykernel import get_connection_file
    from ipykernel.comm import Comm

    def get_current_kernel_id() -> str:
        """
        Return the url of the current jupyter notebook server.
        
        Adapted from: https://github.com/jupyter/notebook/issues/3156
        """
        # path/to/file/kernel-c13462b6-c6a2-4e17-b891-7f7847204df9.json
        connection_file = get_connection_file() # type: ignore
        # kernel-c13462b6-c6a2-4e17-b891-7f7847204df9.json
        file_name: str = os.path.basename(connection_file) 
        return file_name[len('kernel-'):-len('.json')] 
    
except ImportError:

    # If we're running in jupyterlite, we don't have access to the ipykernel module.
    # So we just return a dummy kernel id. And on the frontend, if we get this kernel
    # id, we just do our best to find the right kernel to establish a comm with
    def get_current_kernel_id() -> str:
        return 'kernel-00000000-0000-0000-0000-000000000000'
    
    class Comm: # type: ignore
        def send(
            self,
            data: Any,
            metadata: Any,
            buffers: Any
        ) -> None:
            pass

        def on_msg(
            self,
            callback: Callable
        ) -> None:
            pass