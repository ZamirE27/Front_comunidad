import { createPost, getPosts, deletePost, updatePost, createComment, createReaction } from '../services/post.service.js';
import { getProfileData } from '../services/profile.service.js';

let currentEditingPostId = null;

function renderPost(post, currentProfileId) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const API_URL = 'http://localhost:3000/';

    const authorName = post.Profile && post.Profile.User
        ? `${post.Profile.User.first_name} ${post.Profile.User.last_name}`
        : 'Usuario Desconocido'; 

    const profilePhotoUrl = post.Profile && post.Profile.profile_photo
    ? post.Profile.profile_photo
        : 'assets/default-user.png';
    
    let mediaContent = '';
    if (post.image_url) {
    mediaContent = `<img src="${post.image_url}" alt="Post Image" class="post-image">`;
    } else if (post.code_url) {
        mediaContent = `<pre><code class="language-javascript">...</code></pre><p>Archivo de código: <a href="${API_URL}${post.code_url}">Descargar</a></p>`;
    } else if (post.file_url) {
        mediaContent = `<p>Archivo adjunto: <a href="${API_URL}${post.file_url}">Descargar</a></p>`;
    }

    let privacyEmoji = '';
    if (post.privacy === 'Publico') {
        privacyEmoji = '🌍';
    } else if (post.privacy === 'Amigos') {
        privacyEmoji = '👥';
    } else if (post.privacy === 'Solo yo') {
        privacyEmoji = '🔒';
    }
    
    let actionButtons = '';
    if (post.profile_id === currentProfileId) {
        actionButtons = `
            <div class="post-options-menu">
                <button class="menu-toggle-btn">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="menu-dropdown-content">
                    <button class="edit-btn" data-post-id="${post.post_id}">Editar</button>
                    <button class="delete-btn" data-post-id="${post.post_id}">Eliminar</button>
                </div>
            </div>
        `;
    }

    const reactionsByType = post.Reactions.reduce((acc, reaction) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
        return acc;
    }, {});

    const userReaction = post.Reactions.find(r => r.profile_id === currentProfileId);
    const userReactionType = userReaction ? userReaction.reaction_type : null;
    
    const commentsHtml = post.Comments.map(comment => `
        <div class="comment-item">
            <div class="comment-profile">
                <img src="${comment.Profile.profile_photo || 'assets/default-user.png'}" alt="User Avatar" class="comment-avatar">
                <span class="comment-author">${comment.Profile.User.first_name} ${comment.Profile.User.last_name}</span>
            </div>    
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
        </div>
    `).join('');

    const reactionTranslations = {
        'like': 'Me gusta',
        'love': 'Me encanta',
        'laugh': 'Me divierte',
        'angry': 'Me enoja'
    };
    
    let mainReactionButtonHtml = '';
    let mainReactionEmoji = '👍';
    let mainReactionText = 'Me gusta';

    if (userReactionType) {
        if (userReactionType === 'like') mainReactionEmoji = '👍';
        if (userReactionType === 'love') mainReactionEmoji = '❤️';
        if (userReactionType === 'laugh') mainReactionEmoji = '😂';
        if (userReactionType === 'angry') mainReactionEmoji = '😡';
        mainReactionText = reactionTranslations[userReactionType] || 'Me gusta';
    }
    
    mainReactionButtonHtml = `
        <button class="main-reaction-btn reaction-btn" data-post-id="${post.post_id}" data-reaction-type="${userReactionType || 'like'}">
            <span class="icon">${mainReactionEmoji}</span>
            <span>${mainReactionText}</span>
        </button>
    `;

    const textContentHtml = post.text_content && post.text_content.trim() !== '' 
        ? `<p>${post.text_content}</p>` 
        : '';

    postElement.innerHTML = `
        <div class="post-header">
            
            <div class="post-info">
                <div class="post-auth-info">
                    <img src="${profilePhotoUrl}" alt="User Avatar" class="post-avatar">
                    <span class="post-author">${authorName}</span>
                </div>
                

                <div class="post-details">
                    <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
                    <span class="post-privacy">${privacyEmoji} ${post.privacy}</span>
                </div>
            </div>
        </div>
        <div class="post-content">
            ${textContentHtml}
            ${mediaContent}
        </div>
        <div class="post-stats">
            <span class="reaction-count">👍 ${reactionsByType.like || 0}</span>
            <span class="reaction-count">❤️ ${reactionsByType.love || 0}</span>
            <span class="reaction-count">😂 ${reactionsByType.laugh || 0}</span>
            <span class="reaction-count">😡 ${reactionsByType.angry || 0}</span>
            <span class="comment-count">💬 ${post.Comments.length}</span>
        </div>
        <div class="post-actions">
            <div class="reaction-buttons-container">
                ${mainReactionButtonHtml}
                <div class="reactions-dropdown">
                    <button class="reaction-option" data-reaction-type="like" data-post-id="${post.post_id}">👍</button>
                    <button class="reaction-option" data-reaction-type="love" data-post-id="${post.post_id}">❤️</button>
                    <button class="reaction-option" data-reaction-type="laugh" data-post-id="${post.post_id}">😂</button>
                    <button class="reaction-option" data-reaction-type="angry" data-post-id="${post.post_id}">😡</button>
                </div>
            </div>
            <button class="comment-toggle-btn" data-post-id="${post.post_id}">
                <span class="icon"></span> Comentarios
            </button>
            ${actionButtons}
        </div>
        <div class="comments-section" style="display: none;">
            <div class="comments-list">
                ${commentsHtml}
            </div>
            <div class="comment-form-container">
                <input type="text" class="comment-input" placeholder="Escribe un comentario...">
                <button class="send-comment-btn" data-post-id="${post.post_id}">Enviar</button>
            </div>
        </div>
    `;

    const deleteBtn = postElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'No podrás revertir esto.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#705FFF',
            cancelButtonColor: '#f2f3f5',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                cancelButton: 'cancel-btn-class'
            }
        });

            if (result.isConfirmed) {
                try {
                    await deletePost(post.post_id);
                    Swal.fire(
                        '¡Eliminado!',
                        'Tu publicación ha sido eliminada.',
                        'success'
                    );
                    fetchAndRenderPosts();
                } catch (error) {
                    console.error('Error al eliminar el post:', error);
                    Swal.fire(
                        'Error',
                        'No se pudo eliminar la publicación.',
                        'error'
                    );
                }
            }
        });
    }

    const editBtn = postElement.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            setEditMode(post);
            document.querySelector('.post-creator').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const commentToggleBtn = postElement.querySelector('.comment-toggle-btn');
    const commentsSection = postElement.querySelector('.comments-section');
    if (commentToggleBtn && commentsSection) {
        commentToggleBtn.addEventListener('click', () => {
            const isVisible = commentsSection.style.display === 'block';
            commentsSection.style.display = isVisible ? 'none' : 'block';
        });
    }

    const sendCommentBtn = postElement.querySelector('.send-comment-btn');
    const commentInput = postElement.querySelector('.comment-input');
    if (sendCommentBtn && commentInput) {
        sendCommentBtn.addEventListener('click', async () => {
            const content = commentInput.value.trim();
            if (content) {
                try {
                    await createComment(post.post_id, content);
                    commentInput.value = '';
                    fetchAndRenderPosts();
                } catch (error) {
                console.error('Error al enviar el comentario:', error);
                }
            }
        });
    }

    const reactionBtnContainer = postElement.querySelector('.reaction-buttons-container');
    const reactionsDropdown = postElement.querySelector('.reactions-dropdown');
    const reactionOptions = reactionsDropdown.querySelectorAll('.reaction-option');

        // Lógica de retardo para mostrar/ocultar reacciones sin que desaparezca rápido
        let openTimeout, closeTimeout;
        const openDelay = 120; // ms antes de abrir
        const closeDelay = 300; // ms antes de cerrar para dar tiempo a mover el mouse

        function openDropdown() {
            clearTimeout(closeTimeout);
            if (reactionBtnContainer.classList.contains('open')) return;
            openTimeout = setTimeout(() => {
                reactionBtnContainer.classList.add('open');
            }, openDelay);
        }

        function closeDropdown() {
            clearTimeout(openTimeout);
            closeTimeout = setTimeout(() => {
                reactionBtnContainer.classList.remove('open');
            }, closeDelay);
        }

        reactionBtnContainer.addEventListener('mouseenter', openDropdown);
        reactionBtnContainer.addEventListener('mouseleave', closeDropdown);
        reactionsDropdown.addEventListener('mouseenter', () => {
            clearTimeout(closeTimeout);
        });
        reactionsDropdown.addEventListener('mouseleave', closeDropdown);

        // También abrir al hacer foco con teclado
        const mainReactionBtn = reactionBtnContainer.querySelector('.main-reaction-btn');
        if (mainReactionBtn) {
            mainReactionBtn.addEventListener('focus', () => {
                reactionBtnContainer.classList.add('open');
            });
            mainReactionBtn.addEventListener('blur', () => {
                closeDropdown();
            });
        }

    reactionOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const reactionType = option.dataset.reactionType;
            try {
                await createReaction(post.post_id, reactionType);
                fetchAndRenderPosts();
            } catch (error) {
                console.error('Error al enviar la reacción:', error);
            }
        });
    });

    return postElement;
}


async function fetchAndRenderPosts() {
    try {
        const profile = await getProfileData();
        const currentProfileId = profile.profile_id;
        const posts = await getPosts();
        const feedContainer = document.getElementById('feed');
        if (feedContainer) {
            feedContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = renderPost(post, currentProfileId);
                feedContainer.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

function setupFilePreview() {
    const imageInput = document.getElementById('imageInput');
    const codeInput = document.getElementById('codeInput');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('preview-area');

    const handleFileChange = (event) => {
        previewArea.innerHTML = '';
        const file = event.target.files[0];
        if (file) {
            const fileURL = URL.createObjectURL(file);
            const fileType = file.type;

            if (fileType.startsWith('image/')) {
                previewArea.innerHTML = `<img src="${fileURL}" alt="Preview" class="preview-image">`;
            } else if (fileType.includes('text') || file.name.endsWith('.js') || file.name.endsWith('.py')) {
                previewArea.innerHTML = `<div class="preview-code"><p>Archivo de código seleccionado: <strong>${file.name}</strong></p></div>`;
            } else {
                previewArea.innerHTML = `<div class="preview-file"><p>Archivo seleccionado: <strong>${file.name}</strong></p></div>`;
            }
        }
    };

    imageInput.addEventListener('change', handleFileChange);
    codeInput.addEventListener('change', handleFileChange);
    fileInput.addEventListener('change', handleFileChange);
}

async function updatePostCreatorProfilePhoto() {
    try {
        const profile = await getProfileData();
        const postAvatarImg = document.querySelector('.post-creator .post-avatar');
        if (postAvatarImg && profile.profile_photo) {
            const API_URL = 'http://localhost:3000/';
            postAvatarImg.src = profile.profile_photo;
        }
    } catch (error) {
        console.error('Error al actualizar la foto de perfil del creador de posts:', error);
    }
}

function clearPostForm() {
    document.getElementById('postText').value = '';
    document.getElementById('imageInput').value = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('preview-area').innerHTML = '';
    document.getElementById('privacy').value = 'Publico';
}

function setEditMode(post) {
    currentEditingPostId = post.post_id;
    const postTextarea = document.getElementById('postText');
    const privacySelect = document.getElementById('privacy');
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewArea = document.getElementById('preview-area');
    
    postTextarea.value = post.text_content;
    privacySelect.value = post.privacy;
    
    postBtn.textContent = 'Actualizar Post';
    postBtn.dataset.mode = 'update';
    if (clearBtn) clearBtn.style.display = 'none';

    previewArea.innerHTML = '';
    const API_URL = 'http://localhost:3000/';
    if (post.image_url) {
        previewArea.innerHTML = `<img src="${post.image_url}" alt="Preview" class="preview-image">`;
    } else if (post.code_url) {
        previewArea.innerHTML = `<div class="preview-code"><p>Archivo de código actual: <strong>${post.code_url.split('/').pop()}</strong></p></div>`;
    } else if (post.file_url) {
        previewArea.innerHTML = `<div class="preview-file"><p>Archivo actual: <strong>${post.file_url.split('/').pop()}</strong></p></div>`;
    }
}

function setCreateMode() {
    currentEditingPostId = null;
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');

    postBtn.textContent = 'POST';
    postBtn.dataset.mode = 'create';
    if (clearBtn) clearBtn.style.display = 'inline-block';
    clearPostForm();
}

export function setupPostPage() {
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');
    const postTextarea = document.getElementById('postText');
    const privacySelect = document.getElementById('privacy');
    
    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const postContent = postTextarea.value;
            const privacy = privacySelect.value;
            const formData = new FormData();

            const imageInput = document.getElementById('imageInput');
            const codeInput = document.getElementById('codeInput');
            const fileInput = document.getElementById('fileInput');
            
            // --- Lógica de Validación de Contenido ---
            const hasText = postContent.trim().length > 0;
            const hasFile = imageInput.files.length > 0 || codeInput.files.length > 0 || fileInput.files.length > 0;

            if (!hasText && !hasFile) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Contenido vacío',
                    text: 'Debes escribir algo o adjuntar un archivo para crear una publicación.'
                });
                return; // Detiene la ejecución
            }

            formData.append('text_content', postContent);
            formData.append('privacy', privacy);

            if (imageInput.files.length > 0) {
                formData.append('postFile', imageInput.files[0]);
            } else if (codeInput.files.length > 0) {
                formData.append('postFile', codeInput.files[0]);
            } else if (fileInput.files.length > 0) {
                formData.append('postFile', fileInput.files[0]);
            }

            for (let pair of formData.entries()) {
                console.log('FormData:', pair[0], pair[1]);
            }

            try {
                let postResponse;
                if (postBtn.dataset.mode === 'update') {
                    postResponse = await updatePost(currentEditingPostId, formData);
                    Swal.fire('¡Actualizado!', 'Tu publicación ha sido actualizada.', 'success');
                    setCreateMode();
                } else {
                    postResponse = await createPost(formData);
                    clearPostForm();
                }
                fetchAndRenderPosts();
            } catch (err) {
                console.error('Error al procesar el post:', err);
                Swal.fire(
                    'Error',
                    'Ocurrió un error al procesar la publicación. ' + (err.message || 'Inténtalo de nuevo.'),
                    'error'
                );
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearPostForm();
        });
    }
    
    setupFilePreview();
    updatePostCreatorProfilePhoto();
    fetchAndRenderPosts();
}